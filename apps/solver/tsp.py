# OR-Tools requires three primary components:
# 1. RoutingIndexManager: Maps problem node indices (0..N-1) to solver internal routing variables/indices.
# 2. RoutingModel: Formulates the optimization problem (cost matrix, capacity constraints, time windows).
# 3. Callbacks: Evaluator functions called by the solver to look up travel times or item capacities dynamically.

from ortools.constraint_solver import routing_enums_pb2  # Contains search strategy enums (e.g. PATH_CHEAPEST_ARC)
from ortools.constraint_solver import pywrapcp             # Core Python wrapper for Constraint Programming solver

def solve_cvrptw(duration_matrix, vehicle_capacities, demands, starts, ends, time_windows, time_limit_seconds=3, max_time=86400):
    """
    Solves a Capacitated Vehicle Routing Problem with Time Windows (CVRPTW).
    Supports multiple vehicles with different starting and ending nodes.
    
    Parameters:
    - duration_matrix: 2D array of travel times (in seconds) between all node pairs.
    - vehicle_capacities: List of maximum weight/volume capacities for each vehicle.
    - demands: List of weight/volume demands for each node (orders have >0, depots have 0).
    - starts: List of starting node indices for each vehicle driver.
    - ends: List of ending node indices for each vehicle driver.
    - time_windows: List of (start_seconds, end_seconds) allowable arrival ranges for each node.
    - time_limit_seconds: Max execution time for the solver heuristic.
    - max_time: Ceiling limit (in seconds) for vehicle routing time calculations.
    """
    # Total count of nodes (orders + driver depots)
    num_nodes = len(duration_matrix)
    # Total count of available vehicles / drivers
    num_vehicles = len(vehicle_capacities)
    
    # Manager handles index translation between external node IDs and internal solver routing indices
    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, starts, ends)
    # Instantiate the core vehicle routing optimization model using the manager
    routing = pywrapcp.RoutingModel(manager)

    # -------------------------------------------------------------
    # 1. Travel time (transit) callback & Arc Cost Evaluator
    # -------------------------------------------------------------
    def time_callback(from_index, to_index):
        """Callback returning the transit time (cost) between two solver indices."""
        from_node = manager.IndexToNode(from_index) # Convert solver from-index to original node ID
        to_node = manager.IndexToNode(to_index)     # Convert solver to-index to original node ID
        return duration_matrix[from_node][to_node]  # Retrieve drive duration in seconds from matrix

    # Register the time callback function with the routing engine
    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    # Set total drive time as the primary objective cost function for all vehicles to minimize
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # -------------------------------------------------------------
    # 2. Capacity callback & Vehicle Load Dimension
    # -------------------------------------------------------------
    def demand_callback(from_index):
        """Callback returning the demand (load weight/volume) at a given solver index."""
        from_node = manager.IndexToNode(from_index) # Convert solver index to original node ID
        return demands[from_node]                    # Return cargo demand for this node

    # Register unary transit callback (only depends on origin node)
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    # Add cumulative Capacity dimension to track accumulated load per vehicle along its route
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index, # Demand evaluator
        0,                     # Null capacity slack (no extra load leeway)
        vehicle_capacities,    # List of vehicle capacity limits
        True,                  # Start cumulative load at zero at start depot
        'Capacity'             # Dimension identifier string
    )

    # -------------------------------------------------------------
    # 3. Time dimension (Time Windows & Arrival Constraints)
    # -------------------------------------------------------------
    # max_time is computed from actual window values to handle midnight-crossing orders
    routing.AddDimension(
        transit_callback_index, # Transit time evaluator
        max_time,               # Allow waiting time (slack) up to the full planning horizon
        max_time,               # Maximum cumulative route duration per vehicle
        False,                  # Don't force start time to 0 (vehicles can start whenever needed within window)
        'Time'                  # Dimension identifier string
    )
    # Get reference to the created Time dimension object
    time_dimension = routing.GetDimensionOrDie('Time')

    # Apply time window constraints (earliest allowed start, latest allowed end) for every node
    for node in range(num_nodes):
        index = manager.NodeToIndex(node) # Convert node ID to internal solver index
        if index < 0:
            continue # Skip invalid or unused nodes
        start_w, end_w = time_windows[node] # Unpack node start and end window limits
        # Defensive check: ensure start <= end (should already be handled upstream)
        if start_w > end_w:
            print(f"  WARNING: node {node} has inverted window ({start_w}, {end_w}), clamping end to max_time")
            end_w = max_time
        # Set allowed time range [start_w, end_w] for arrival/service at this node variable
        time_dimension.CumulVar(index).SetRange(int(start_w), int(end_w))

    # -------------------------------------------------------------
    # 4. Disjunctions (Allow dropping orders with penalty if unfeasible)
    # -------------------------------------------------------------
    start_set = set(starts) # Set of driver start node indices
    end_set = set(ends)     # Set of driver end node indices
    penalty = 1000000       # High penalty value assigned if an order is unserviced/dropped
    for node in range(num_nodes):
        # Driver start and end depots must never be dropped
        if node not in start_set and node not in end_set:
            index = manager.NodeToIndex(node) # Map node to solver index
            if index >= 0:
                # Add disjunction allowing solver to skip this node at cost of penalty
                routing.AddDisjunction([index], penalty)

    # -------------------------------------------------------------
    # 5. Search Parameters & Optimization Strategy
    # -------------------------------------------------------------
    # Initialize default search parameters for routing solver
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    # First Solution Strategy: build initial solution quickly using path cheapest arc algorithm
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    # Metaheuristic: use Guided Local Search to escape local minima during optimization
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    # Limit solver runtime budget
    search_parameters.time_limit.seconds = time_limit_seconds

    print(f"\n  [tsp.py] Calling routing.SolveWithParameters (time_limit={time_limit_seconds}s)...")
    # Execute the OR-Tools constraint solver
    solution = routing.SolveWithParameters(search_parameters)
    print(f"  [tsp.py] Solver status: {routing.status()}")
    # Status code lookup dictionary for debugging
    status_names = {0: 'ROUTING_NOT_SOLVED', 1: 'ROUTING_SUCCESS', 2: 'ROUTING_PARTIAL_SUCCESS_LOCAL_OPTIMUM_NOT_REACHED',
                    3: 'ROUTING_FAIL', 4: 'ROUTING_FAIL_TIMEOUT'}
    print(f"  [tsp.py] Status meaning: {status_names.get(routing.status(), 'UNKNOWN')}")

    # If no valid solution structure returned, return empty result structures
    if not solution:
        print("  [tsp.py] No solution object returned!")
        return None, [], []

    # -------------------------------------------------------------
    # 6. Extract Solution Routes, Unassigned Nodes, and Durations
    # -------------------------------------------------------------
    routes = []
    unassigned_nodes = []
    route_durations = []

    # Check assignment status for every non-depot order node
    print("  [tsp.py] Node assignment status:")
    for node in range(num_nodes):
        if node not in start_set and node not in end_set:
            index = manager.NodeToIndex(node)
            if index >= 0:
                # ActiveVar is 1 if node is visited in a route, 0 if dropped
                is_active = solution.Value(routing.ActiveVar(index))
                cumul_time = solution.Value(time_dimension.CumulVar(index)) if is_active else -1
                print(f"    node {node}: active={is_active}  cumul_time={cumul_time}  "
                      f"tw=({time_windows[node][0]},{time_windows[node][1]})  demand={demands[node]}")
                # Track nodes dropped by solver
                if is_active == 0:
                    unassigned_nodes.append(node)

    # Extract sequential route paths for each vehicle driver
    for vehicle_id in range(num_vehicles):
        route = []
        index = routing.Start(vehicle_id) # Start at driver depot index
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index) # Convert solver index to node ID
            route.append(node)
            index = solution.Value(routing.NextVar(index)) # Advance to next node variable in route solution
        route.append(manager.IndexToNode(index)) # Append final depot node
        routes.append(route)

        # Calculate vehicle's total route time (arrival time at end depot - departure time at start depot)
        start_index = routing.Start(vehicle_id)
        end_index = routing.End(vehicle_id)
        duration = solution.Value(time_dimension.CumulVar(end_index)) - solution.Value(time_dimension.CumulVar(start_index))
        route_durations.append(duration)

    return routes, unassigned_nodes, route_durations


def solve_tsp(duration_matrix, vehicle_capacities, demands, depot_index=0, time_limit_seconds=3):
    """
    Wrapper for standard TSP/VRP that delegates to solve_cvrptw with single depot starts/ends.
    
    Parameters:
    - duration_matrix: Matrix of travel times.
    - vehicle_capacities: List of vehicle capacities.
    - demands: List of node demands.
    - depot_index: Index of the central depot (default 0).
    - time_limit_seconds: Max solver time in seconds.
    """
    num_stops = len(duration_matrix) # Number of stops in duration matrix
    num_vehicles = len(vehicle_capacities) # Number of vehicles
    starts = [depot_index] * num_vehicles # All vehicles start at depot_index
    ends = [depot_index] * num_vehicles # All vehicles return to depot_index
    time_windows = [(0, 24 * 3600) for _ in range(num_stops)] # Full 24h window for all stops
    
    # Call the CVRPTW solver with simplified depot inputs
    routes, unassigned, durations = solve_cvrptw(
        duration_matrix, vehicle_capacities, demands, starts, ends, time_windows, time_limit_seconds
    )
    return routes

