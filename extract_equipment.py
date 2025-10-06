import pandas as pd
import json

# Read the Excel file with proper header row
df = pd.read_excel('attached_assets/EQUIPMENT MASTER LIST -SEPTEMBER 2018 E.C_1759791262397.xlsx', header=4)

# Filter for DOZER and WHEEL LOADER only
equipment_types = [' DOZER', 'DOZER', ' WHEEL LOADER', 'WHEEL LOADER', 'Wheel loader']
df_filtered = df[df['EQUIPMENT TYPE'].isin(equipment_types)]

# Clean up the data
df_filtered = df_filtered.fillna('')

# Extract relevant columns
equipment_list = []
for _, row in df_filtered.iterrows():
    equipment = {
        'equipmentType': str(row['EQUIPMENT TYPE']).strip(),
        'make': str(row['MAKE']).strip(),
        'model': str(row['MODEL']).strip(),
        'plateNumber': str(row['PLATE NO.']).strip() if 'PLATE NO.' in df.columns else '',
        'assetNumber': str(row['ASSET NO.']).strip() if 'ASSET NO.' in df.columns else '',
        'newAssetNumber': str(row['NEW ASSET NO.']).strip() if 'NEW ASSET NO.' in df.columns else '',
        'serialNumber': str(row['MACHINE SERIAL NO.']).strip() if 'MACHINE SERIAL NO.' in df.columns else '',
        'location': str(row['CURRENT LOCATION ']).strip() if 'CURRENT LOCATION ' in df.columns else ''
    }
    equipment_list.append(equipment)

print(json.dumps(equipment_list, indent=2))
