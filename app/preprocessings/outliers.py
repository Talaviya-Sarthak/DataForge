# import pandas as pd
# import numpy as np

# class HandlingOutliers:
#     def __init__(self, transformations: list):
#         self.transformations = transformations
        
#     def apply(self, df: pd.DataFrame) -> pd.DataFrame:
#         df = df.copy()

#         for t in self.transformations:
#             col = t["column"]
#             strategy = t["strategy"]
#             dtype = t["dtype"]

#             # Defensive checks
#             if col not in df.columns:
#                 continue

#             if dtype != "numeric":
#                 continue
            
#             if