import pandas as pd


class ValueStandardization:
    def __init__(self, transformations: list):
        """
        transformations: list of dicts

        Example:
        {
            "column": "gender",
            "operation": "replace",
            "mapping": {
                "m": "Male",
                "male": "Male",
                "f": "Female",
                "female": "Female",
                "fe male": "Female"
            }
        }
        """
        self.transformations = transformations

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        for t in self.transformations:
            col = t["column"]
            mapping = t["mapping"]

            if col not in df.columns:
                continue

            df[col] = self._standardize_column(df[col], mapping)

        return df

    def _standardize_column(self, series: pd.Series, mapping: dict) -> pd.Series:
        """
        Normalize text and replace values using mapping
        """
        # Normalize text first
        series = (
            series
            .astype(str)
            .str.lower()
            .str.strip()
            .str.replace(r"\s+", " ", regex=True)
        )

        # Apply mapping
        series = series.replace(mapping)

        # Convert 'nan' string back to actual NaN
        series = series.replace("nan", pd.NA)

        return series
