import pandas as pd
import os
from io import StringIO

def process_polar_csv(file_path):
    """
    Reads a Polar Flow CSV file, combines date and time information,
    and returns a pandas DataFrame with datetime and heart rate.

    Args:
        file_path (str): The path to the Polar Flow CSV file.

    Returns:
        pandas.DataFrame: A DataFrame with 'datetime' and 'heart_rate' columns,
                          or None if the file is not found.
    """
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return None

    with open(file_path, 'r') as f:
        lines = f.readlines()

    # --- Extract Header Information ---
    # The first two lines contain the session metadata.
    header_data = pd.read_csv(StringIO("".join(lines[:2])))
    
    # Get the date and start time from the first data row of the header section.
    session_date = header_data.loc[0, 'Date']
    start_time = header_data.loc[0, 'Start time']

    # --- Extract Time Series Data ---
    # The actual recorded data starts from the third line.
    data_io = StringIO("".join(lines[2:]))
    df = pd.read_csv(data_io)

    # --- Data Cleaning and Transformation ---
    # Rename columns for easier access.
    df = df.rename(columns={'Time': 'time_offset', 'HR (bpm)': 'heart_rate'})

    # Combine the date and start time with the time offset of each data point.
    # First, create the full start datetime string.
    start_datetime_str = f"{session_date} {start_time}"
    
    # Convert the start datetime string to a pandas datetime object.
    start_datetime = pd.to_datetime(start_datetime_str, format='%d-%m-%Y %H:%M:%S')
    
    # Convert the time_offset column to timedelta objects.
    df['time_offset'] = pd.to_timedelta(df['time_offset'])

    # Create the final datetime column by adding the offset to the start time.
    df['time'] = start_datetime + df['time_offset']

    # --- Final DataFrame ---
    # Select and return the desired columns.
    final_df = df[['time', 'heart_rate']].copy()
    
    # Drop rows where heart rate is not available (NaN).
    final_df.dropna(subset=['heart_rate'], inplace=True)
    
    # Convert heart rate to integer type.
    final_df['heart_rate'] = final_df['heart_rate'].astype(int)

    return final_df

# --- How to use the function ---

# Get the directory where the script is being executed.
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the CSV file.
# This assumes 'polar.csv' is in the same directory as your Python script.
csv_file_path = os.path.join(script_dir, 'polar.csv')

# Process the file and get the DataFrame.
heart_rate_df = process_polar_csv(csv_file_path)

heart_rate_df.to_csv("heart_rate_df.csv", index=False)
# Print the resulting DataFrame.
if heart_rate_df is not None:
    print("Successfully processed Polar Flow data:")
    print(heart_rate_df.head())