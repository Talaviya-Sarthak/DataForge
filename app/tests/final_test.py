import pandas as pd
from app.preprocessings.pipeline import PreprocessingPipeline

data = {
    "age": [25, None, 30, 25],
    "gender": ["m", "male", "f", "female"],
    "salary": [50000, 60000, 70000, 100000],
    "churn": [0, 1, 0, 1]
}

df = pd.DataFrame(data)

config = {
    "value_standardization": [
        {
            "column": "gender",
            "mapping": {
                "m": "Male",
                "male": "Male",
                "f": "Female",
                "female": "Female"
            }
        }
    ],
    "missing": [
        {"column": "age", "strategy": "median", "dtype": "numeric"}
    ],
    "encoding": [
        {"column": "gender", "strategy": "onehot", "dtype": "categorical"}
    ],
    "scaling": [
        {"column": "salary", "strategy": "robust"}
    ]
}

pipeline = PreprocessingPipeline(
    value_standardization_steps=config["value_standardization"],
    missing_value_steps=config["missing"],
    encoding_steps=config["encoding"],
    scaling_steps=config["scaling"]
)

processed_df = pipeline.run(df)

print(processed_df)
