import pandas as pd
import numpy as np
import json
from itertools import combinations


class InteractionFeatureEngineer:

    def __init__(self, transformations):
        # Normalize transformations to ensure they are dicts
        if isinstance(transformations, str):
            transformations = json.loads(transformations)
        
        if not isinstance(transformations, list):
            transformations = [transformations] if transformations else []
            
        # Normalize each transformation
        normalized_transformations = []
        for t in transformations:
            if isinstance(t, str):
                t = json.loads(t)
            if isinstance(t, dict):
                normalized_transformations.append(t)
        
        self.transformations = normalized_transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:

        df = df.copy()

        for t in self.transformations:
            numeric_columns = t.get("numeric_columns", [])
            max_combinations = t.get("max_combinations", 5)

            if len(numeric_columns) < 2:
                continue

            count = 0

            for col1, col2 in combinations(numeric_columns, 2):

                if count >= max_combinations:
                    break

                if col1 not in df.columns or col2 not in df.columns:
                    continue

                df[f"{col1}_mult_{col2}"] = df[col1] * df[col2]

                with np.errstate(divide="ignore", invalid="ignore"):
                    div = df[col1] / df[col2]
                    div.replace([np.inf, -np.inf], 0, inplace=True)
                    div.fillna(0, inplace=True)
                    df[f"{col1}_div_{col2}"] = div

                count += 1

        return df
