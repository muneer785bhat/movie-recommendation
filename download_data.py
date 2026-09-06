import kagglehub
import pandas as pd
import os
import shutil

# Download the dataset
dataset_path = kagglehub.dataset_download(
    "rounakbanik/the-movies-dataset"
)

print("Dataset downloaded to:")
print(dataset_path)

# Find movies_metadata.csv
source_file = os.path.join(dataset_path, "movies_metadata.csv")

# Read CSV manually
df = pd.read_csv(
    source_file,
    encoding="latin-1",
    low_memory=False,
    on_bad_lines="skip"
)

print("\nDataset loaded successfully!")
print("Shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 movies:")
print(df[["title", "overview", "genres"]].head())

# Create data folder
os.makedirs("data", exist_ok=True)

# Save a local copy
df.to_csv("data/movies.csv", index=False)

print("\nSaved successfully to:")
print("data/movies.csv")