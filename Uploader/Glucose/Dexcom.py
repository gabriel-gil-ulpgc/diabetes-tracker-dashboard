# dexcom_processor.py

import pandas as pd
import os


class DexcomProcessor:
    """
    Procesador específico para archivos CSV de glucosa del modelo Dexcom.
    Recibe una ruta de archivo CSV y devuelve un DataFrame limpio y estandarizado.
    """

    def __init__(self):
        """Inicializa el procesador para archivos Libreview."""
        self.date_col = "Marca temporal (AAAA-MM-DDThh:mm:ss)"
        self.glucose_col = "Nivel de glucosa (mg/dL)"
        self.header_row = 0

    def _clean_and_standardize(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Toma un DataFrame crudo de Libreview y lo devuelve limpio y estandarizado.
        """
        # 1. Renombrar y seleccionar columnas
        df_processed = df.rename(
            columns={self.date_col: "time", self.glucose_col: "glucose"}
        )
        df_processed = df_processed[["time", "glucose"]]

        # 2. Limpieza de nulos
        df_processed.dropna(subset=["time", "glucose"], inplace=True)

        # 3. Conversión de tipos
        df_processed["time"] = pd.to_datetime(
            df_processed["time"], errors="coerce", format="mixed"
        )

        # Reemplazar valores de texto en la columna de glucosa antes de convertir a numérico
        df_processed["glucose"] = df_processed["glucose"].replace(
            {"Nivel alto": 400, "Nivel bajo": 40}
        )

        df_processed["glucose"] = pd.to_numeric(
            df_processed["glucose"], errors="coerce"
        )

        # Volver a limpiar nulos por si la conversión falló
        df_processed.dropna(subset=["time", "glucose"], inplace=True)
        df_processed["glucose"] = df_processed["glucose"].astype(int)

        # 4. Ordenar y eliminar duplicados
        df_processed.sort_values(by="time", inplace=True)
        df_processed.drop_duplicates(subset="time", keep="first", inplace=True)

        return df_processed.reset_index(drop=True)

    def process(self, file_path: str) -> pd.DataFrame:
        """
        Método principal para procesar los datos de glucosa de Libreview.

        :param file_path: Ruta al archivo CSV de Libreview.
        :return: Un DataFrame de pandas con las columnas 'time' y 'glucose'.
        """
        try:
            # Cargar los datos en un DataFrame
            df_raw = pd.read_csv(
                file_path,
                header=self.header_row,
                usecols=[self.date_col, self.glucose_col],
                sep=";",
            )

            # Limpiar, estandarizar y devolver
            return self._clean_and_standardize(df_raw)

        except FileNotFoundError:
            print(f"Error: No se encontró el archivo '{file_path}'")
            return pd.DataFrame({"time": [], "glucose": []})
        except Exception as e:
            print(f"Error procesando el archivo: {e}")
            return pd.DataFrame({"time": [], "glucose": []})


# --- Ejemplo de Uso ---
if __name__ == "__main__":
    # Crea una instancia del procesador
    processor = DexcomProcessor()

    # Obtener la ruta del directorio donde está este archivo Python
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construir la ruta al archivo clarity.csv relativa al archivo Python
    ruta = os.path.join(script_dir, "clarity.csv")

    print(f"Buscando archivo en: {ruta}")
    print(f"¿Existe el archivo? {os.path.exists(ruta)}")

    df = processor.process(ruta)
    print(f"\nDatos procesados: {len(df)} registros")
    if not df.empty:
        print(f"Rango de fechas: {df['time'].min()} a {df['time'].max()}")
        print(f"Rango de glucosa: {df['glucose'].min()} - {df['glucose'].max()} mg/dL")
        print("\nPrimeras 5 filas:")
        print(df.head())
        print("\nÚltimas 5 filas:")
        print(df.tail())
