from tsp import solve_cvrptw
import json

duration_matrix = [
  [0, 658.4, 317, 1152.5, 1120.9, 232.3, 1136.8],
  [669.5, 0, 792.8, 1188.9, 1157.3, 720.3, 1173.2],
  [313, 726.9, 0, 1218.7, 1187.1, 184, 1203],
  [843, 861, 966.3, 0, 662.5, 893.8, 678.4],
  [1170, 1188, 1293.3, 677.7, 0, 1220.8, 257.1],
  [151.7, 565.6, 289.3, 1057.4, 1025.8, 0, 1041.7],
  [1104.6, 1122.6, 1227.9, 612.3, 336, 1155.4, 0]
]

vehicle_capacities = [500, 750]
demands = [15, 25, 10, 50, 12, 0, 0]
starts = [5, 6]
ends = [5, 6]

# Convert all duration matrix entries to integer seconds for OR-Tools
int_matrix = [[int(val) for val in row] for row in duration_matrix]

# Time windows: 8:00 (28800s) to 18:00 (64800s) for orders, and 24 hours (0 to 86400s) for drivers
time_windows = [(28800, 64800)] * 5 + [(0, 86400)] * 2

routes, unassigned, durations = solve_cvrptw(
    int_matrix, vehicle_capacities, demands, starts, ends, time_windows
)

print("Routes:", routes)
print("Unassigned:", unassigned)
print("Durations (seconds):", durations)
