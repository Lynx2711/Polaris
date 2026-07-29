# or-tools needs three things: a manager (translates stop numbers), a model (the problem definition), and callbacks (looks up matrix/demands)

from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def solve_cvrptw(duration_matrix, vehicle_capacities, demands, starts, ends, time_windows, time_limit_seconds=3, max_time=86400):
    """
    Solves a Capacitated Vehicle Routing Problem with Time Windows (CVRPTW).
    Supports multiple vehicles with different starting and ending nodes.
    """
    num_nodes = len(duration_matrix)
    num_vehicles = len(vehicle_capacities)
    
    # Manager handles conversion between node indices and routing indices
    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, starts, ends)
    routing = pywrapcp.RoutingModel(manager)

    # 1. Travel time (transit) callback
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return duration_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 2. Capacity callback and dimension
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0, # null capacity slack
        vehicle_capacities,
        True, # start cumul to zero
        'Capacity'
    )

    # 3. Time dimension (Time Windows)
    # max_time is computed from actual window values to handle midnight-crossing orders
    routing.AddDimension(
        transit_callback_index,
        max_time, # allow waiting time (slack) up to the full horizon
        max_time, # max cumulative time per vehicle
        False, # don't force start cumul to zero (vehicles choose their start time)
        'Time'
    )
    time_dimension = routing.GetDimensionOrDie('Time')

    # Add time window constraints for each node
    for node in range(num_nodes):
        index = manager.NodeToIndex(node)
        if index < 0:
            continue
        start_w, end_w = time_windows[node]
        # Defensive: ensure start <= end (should already be fixed upstream)
        if start_w > end_w:
            print(f"  WARNING: node {node} has inverted window ({start_w}, {end_w}), clamping end to max_time")
            end_w = max_time
        time_dimension.CumulVar(index).SetRange(int(start_w), int(end_w))

    # 4. Disjunctions (allow dropping orders with a penalty if unfeasible)
    start_set = set(starts)
    end_set = set(ends)
    penalty = 1000000 # High penalty for dropping an order
    for node in range(num_nodes):
        # Starts and ends must not be dropped
        if node not in start_set and node not in end_set:
            index = manager.NodeToIndex(node)
            if index >= 0:
                routing.AddDisjunction([index], penalty)

    # 5. Search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = time_limit_seconds

    print(f"\n  [tsp.py] Calling routing.SolveWithParameters (time_limit={time_limit_seconds}s)...")
    solution = routing.SolveWithParameters(search_parameters)
    print(f"  [tsp.py] Solver status: {routing.status()}")
    # Status codes: 0=NOT_SOLVED, 1=SUCCESS, 2=PARTIAL_SUCCESS (feasible but not proven optimal),
    #               3=INFEASIBLE, 4=NOT_SOLVED (timeout before any feasible found)
    status_names = {0: 'ROUTING_NOT_SOLVED', 1: 'ROUTING_SUCCESS', 2: 'ROUTING_PARTIAL_SUCCESS_LOCAL_OPTIMUM_NOT_REACHED',
                    3: 'ROUTING_FAIL', 4: 'ROUTING_FAIL_TIMEOUT'}
    print(f"  [tsp.py] Status meaning: {status_names.get(routing.status(), 'UNKNOWN')}")

    if not solution:
        print("  [tsp.py] No solution object returned!")
        return None, [], []

    # 6. Extract solution
    routes = []
    unassigned_nodes = []
    route_durations = []

    # Find unassigned order nodes
    print("  [tsp.py] Node assignment status:")
    for node in range(num_nodes):
        if node not in start_set and node not in end_set:
            index = manager.NodeToIndex(node)
            if index >= 0:
                is_active = solution.Value(routing.ActiveVar(index))
                cumul_time = solution.Value(time_dimension.CumulVar(index)) if is_active else -1
                print(f"    node {node}: active={is_active}  cumul_time={cumul_time}  "
                      f"tw=({time_windows[node][0]},{time_windows[node][1]})  demand={demands[node]}")
                if is_active == 0:
                    unassigned_nodes.append(node)

    for vehicle_id in range(num_vehicles):
        route = []
        index = routing.Start(vehicle_id)
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            route.append(node)
            index = solution.Value(routing.NextVar(index))
        route.append(manager.IndexToNode(index))
        routes.append(route)

        # Calculate vehicle total route duration (including waiting time)
        start_index = routing.Start(vehicle_id)
        end_index = routing.End(vehicle_id)
        duration = solution.Value(time_dimension.CumulVar(end_index)) - solution.Value(time_dimension.CumulVar(start_index))
        route_durations.append(duration)

    return routes, unassigned_nodes, route_durations


def solve_tsp(duration_matrix, vehicle_capacities, demands, depot_index=0, time_limit_seconds=3):
    """
    Wrapper for solve_tsp that delegates to solve_cvrptw with single depot starts/ends.
    """
    num_stops = len(duration_matrix)
    num_vehicles = len(vehicle_capacities)
    starts = [depot_index] * num_vehicles
    ends = [depot_index] * num_vehicles
    time_windows = [(0, 24 * 3600) for _ in range(num_stops)]
    
    routes, unassigned, durations = solve_cvrptw(
        duration_matrix, vehicle_capacities, demands, starts, ends, time_windows, time_limit_seconds
    )
    return routes
