# tandem_processor.py

import pandas as pd
import os
import glob
from datetime import timedelta
import logging

# Configurar logging detallado
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class TandemProcessor:
    """
    Procesador específico para archivos CSV de glucosa e insulina del modelo Tandem.
    Recibe una ruta de carpeta y busca todos los archivos cgm_data_*.csv, basal_data_*.csv y bolus_data_*.csv para procesarlos.
    """

    def __init__(self):
        """Inicializa el procesador para archivos Tandem."""
        self.date_col = "Marca de tiempo"
        self.glucose_col = "Valor de glucosa del MCG (mg/dl)"
        self.header_row = 1

        # Datos procesados
        self.glucose_data = None
        self.basal_data = None
        self.bolus_data = None

    def _find_cgm_files(self, folder_path: str) -> list:
        """
        Busca todos los archivos cgm_data_*.csv en la carpeta especificada.

        :param folder_path: Ruta a la carpeta que contiene los archivos CSV.
        :return: Lista de rutas completas a los archivos encontrados.
        """
        pattern = os.path.join(folder_path, "cgm_data_*.csv")
        files = glob.glob(pattern)
        logger.info(
            f"Archivos CGM encontrados en '{folder_path}': {len(files)} archivos"
        )
        for file in files:
            logger.info(f"  - {os.path.basename(file)}")
        return sorted(files)

    def _find_insulin_files(self, folder_path: str) -> tuple:
        """
        Busca archivos de insulina basal y bolus en la carpeta especificada.

        :param folder_path: Ruta a la carpeta que contiene los archivos CSV.
        :return: Tupla con (archivos_basales, archivos_bolus)
        """
        # Buscar archivos de insulina basal
        basal_pattern = os.path.join(folder_path, "Insulin data", "basal_data_*.csv")
        basal_files = glob.glob(basal_pattern)
        logger.info(
            f"Archivos de insulina basal encontrados: {len(basal_files)} archivos"
        )
        for file in basal_files:
            logger.info(f"  - {os.path.basename(file)}")

        # Buscar archivos de insulina bolus
        bolus_pattern = os.path.join(folder_path, "Insulin data", "bolus_data_*.csv")
        bolus_files = glob.glob(bolus_pattern)
        logger.info(
            f"Archivos de insulina bolus encontrados: {len(bolus_files)} archivos"
        )
        for file in bolus_files:
            logger.info(f"  - {os.path.basename(file)}")

        return sorted(basal_files), sorted(bolus_files)

    def _clean_and_standardize(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Toma un DataFrame crudo de Tandem y lo devuelve limpio y estandarizado.
        """
        # 1. Renombrar y seleccionar columnas
        df_processed = df.rename(
            columns={self.date_col: "time", self.glucose_col: "glucose"}
        )
        df_processed = df_processed[["time", "glucose"]]

        # 2. Limpieza de nulos
        df_processed.dropna(subset=["time", "glucose"], inplace=True)

        # 3. Conversión de tipos
        # Para Tandem, el formato de fecha es DD/MM/YYYY HH:MM
        df_processed["time"] = pd.to_datetime(
            df_processed["time"], errors="coerce", format="%d/%m/%Y %H:%M"
        )

        # Convertir glucosa a numérico
        df_processed["glucose"] = pd.to_numeric(
            df_processed["glucose"], errors="coerce"
        )

        # Limitar valores de glucosa: cambiar valores > 400 por 400
        df_processed["glucose"] = df_processed["glucose"].clip(upper=400)

        # Volver a limpiar nulos por si la conversión falló
        df_processed.dropna(subset=["time", "glucose"], inplace=True)
        df_processed["glucose"] = df_processed["glucose"].astype(int)

        # 4. Ordenar y eliminar duplicados
        df_processed.sort_values(by="time", inplace=True)
        df_processed.drop_duplicates(subset="time", keep="first", inplace=True)

        return df_processed.reset_index(drop=True)

    def _load_basal_data(self, file_path):
        """Cargar datos de insulina basal"""
        logger.info(f"Cargando datos de insulina basal desde: {file_path}")

        try:
            # Leer el archivo CSV saltando la primera fila (información del período)
            df = pd.read_csv(file_path, skiprows=1)

            # Limpiar nombres de columnas
            df.columns = df.columns.str.strip()

            # Convertir marca de tiempo
            df["Marca de tiempo"] = pd.to_datetime(
                df["Marca de tiempo"], format="%d/%m/%Y %H:%M"
            )

            # Limpiar y convertir datos numéricos
            df["Duración (minutos)"] = pd.to_numeric(
                df["Duración (minutos)"], errors="coerce"
            )

            # Manejar tasas, incluyendo suspensiones (tasa = 0)
            df["Tasa"] = (
                df["Tasa"].astype(str).str.replace(",", ".").str.replace('"', "")
            )
            df["Tasa"] = pd.to_numeric(df["Tasa"], errors="coerce")

            # Para suspensiones, establecer tasa = 0
            df.loc[df["Tipo de insulina"] == "Suspensión", "Tasa"] = 0

            # Filtrar filas válidas (permitir tasa = 0 para suspensiones)
            df = df.dropna(subset=["Marca de tiempo", "Duración (minutos)"])
            df = df.dropna(subset=["Tasa"])  # Solo eliminar si Tasa es NaN, no si es 0

            # Manejar duplicados: mantener el último registro para cada marca de tiempo
            df = df.sort_values("Marca de tiempo").drop_duplicates(
                subset=["Marca de tiempo"], keep="last"
            )

            logger.info(
                f"Datos de insulina basal cargados: {len(df)} registros válidos"
            )
            logger.info(
                f"Suspensiones detectadas: {len(df[df['Tipo de insulina'] == 'Suspensión'])} registros"
            )
            logger.info(
                f"Período de datos: {df['Marca de tiempo'].min()} a {df['Marca de tiempo'].max()}"
            )

            return df

        except Exception as e:
            logger.error(f"Error cargando datos de insulina basal: {e}")
            raise

    def _load_bolus_data(self, file_path):
        """Cargar datos de insulina bolus"""
        logger.info(f"Cargando datos de insulina bolus desde: {file_path}")

        try:
            # Leer el archivo CSV saltando la primera fila
            df = pd.read_csv(file_path, skiprows=1)

            # Limpiar nombres de columnas
            df.columns = df.columns.str.strip()

            # Convertir marca de tiempo
            df["Marca de tiempo"] = pd.to_datetime(
                df["Marca de tiempo"], format="%d/%m/%Y %H:%M"
            )

            # Limpiar y convertir datos numéricos
            df["Insulina administrada (U)"] = (
                df["Insulina administrada (U)"]
                .astype(str)
                .str.replace(",", ".")
                .str.replace('"', "")
            )
            df["Insulina administrada (U)"] = pd.to_numeric(
                df["Insulina administrada (U)"], errors="coerce"
            )

            df["Entrada valor de glucemia (mg/dl)"] = pd.to_numeric(
                df["Entrada valor de glucemia (mg/dl)"], errors="coerce"
            )
            df["Ingesta de carbohidratos (g)"] = pd.to_numeric(
                df["Ingesta de carbohidratos (g)"], errors="coerce"
            )
            df["Índice de carbohidratos"] = (
                df["Índice de carbohidratos"]
                .astype(str)
                .str.replace(",", ".")
                .str.replace('"', "")
            )
            df["Índice de carbohidratos"] = pd.to_numeric(
                df["Índice de carbohidratos"], errors="coerce"
            )

            # Filtrar filas válidas
            df = df.dropna(subset=["Marca de tiempo", "Insulina administrada (U)"])

            logger.info(
                f"Datos de insulina bolus cargados: {len(df)} registros válidos"
            )
            logger.info(
                f"Período de datos: {df['Marca de tiempo'].min()} a {df['Marca de tiempo'].max()}"
            )

            return df

        except Exception as e:
            logger.error(f"Error cargando datos de insulina bolus: {e}")
            raise

    def _process_basal_intervals(self, basal_data):
        """Procesar datos basales dividiendo en intervalos de 5 minutos manteniendo la realidad"""
        logger.info(
            "Procesando datos de insulina basal dividiendo en intervalos de 5 minutos"
        )

        # Crear lista para almacenar todos los intervalos de 5 minutos
        intervals = []

        for _, row in basal_data.iterrows():
            start_time = row["Marca de tiempo"]
            duration_minutes = row["Duración (minutos)"]
            rate_uh = row["Tasa"]  # Unidades por hora

            logger.info(
                f"Procesando administración basal: {start_time}, duración: {duration_minutes} min, tasa: {rate_uh} U/h"
            )

            # Dividir el intervalo en sub-intervalos de 5 minutos
            remaining_minutes = duration_minutes
            current_time = start_time

            while remaining_minutes > 0:
                # Determinar la duración de este sub-intervalo (máximo 5 minutos)
                sub_interval_duration = min(5, remaining_minutes)

                # Calcular insulina para este sub-intervalo: (tasa U/h) * (duración h)
                insulin_units = rate_uh * (sub_interval_duration / 60)

                intervals.append(
                    {
                        "time": current_time,
                        "insulin_basal_u": insulin_units,
                        "rate_uh": rate_uh,
                        "duration_minutes": sub_interval_duration,
                        "end_timestamp": current_time
                        + timedelta(minutes=sub_interval_duration),
                    }
                )

                # Actualizar para el siguiente sub-intervalo
                current_time += timedelta(minutes=sub_interval_duration)
                remaining_minutes -= sub_interval_duration

                logger.info(
                    f"  - Sub-intervalo: {current_time - timedelta(minutes=sub_interval_duration)} a {current_time}, "
                    f"duración: {sub_interval_duration} min, insulina: {insulin_units:.4f} U"
                )

        # Crear DataFrame con todos los intervalos
        df_intervals = pd.DataFrame(intervals)

        # Agrupar por time y sumar insulina (por si hay solapamientos)
        df_grouped = (
            df_intervals.groupby("time")
            .agg(
                {
                    "insulin_basal_u": "sum",
                    "rate_uh": "mean",  # Promedio de tasas si hay múltiples
                    "duration_minutes": "sum",
                    "end_timestamp": "max",  # Tomar el timestamp de fin más tardío
                }
            )
            .reset_index()
        )

        logger.info(
            f"Datos basales procesados: {len(df_grouped)} intervalos de 5 minutos"
        )

        return df_grouped

    def _process_bolus_data(self, bolus_data):
        """Procesar datos de insulina bolus"""
        logger.info("Procesando datos de insulina bolus")

        # Seleccionar columnas relevantes y limpiar datos
        bolus_processed = bolus_data[
            [
                "Marca de tiempo",
                "Tipo de insulina",
                "Entrada valor de glucemia (mg/dl)",
                "Ingesta de carbohidratos (g)",
                "Insulina administrada (U)",
                "Administración inicial (U)",
                "Administración extendida (U)",
            ]
        ].copy()

        # Renombrar columnas para facilitar el análisis
        bolus_processed.columns = [
            "time",
            "bolus_type",
            "glucose",
            "CHO(g)",
            "total_insulin",
            "initial_bolus",
            "extended_bolus",
        ]

        # Limpiar datos de administración inicial y extendida
        bolus_processed["initial_bolus"] = (
            bolus_processed["initial_bolus"]
            .astype(str)
            .str.replace(",", ".")
            .str.replace('"', "")
        )
        bolus_processed["initial_bolus"] = pd.to_numeric(
            bolus_processed["initial_bolus"], errors="coerce"
        )

        bolus_processed["extended_bolus"] = (
            bolus_processed["extended_bolus"]
            .astype(str)
            .str.replace(",", ".")
            .str.replace('"', "")
        )
        bolus_processed["extended_bolus"] = pd.to_numeric(
            bolus_processed["extended_bolus"], errors="coerce"
        )

        logger.info(
            f"Datos de insulina bolus procesados: {len(bolus_processed)} registros"
        )

        return bolus_processed

    def process(self, folder_path: str) -> dict:
        """
        Método principal para procesar los datos de glucosa e insulina de Tandem.
        Busca todos los archivos cgm_data_*.csv, basal_data_*.csv y bolus_data_*.csv en la carpeta.

        :param folder_path: Ruta a la carpeta que contiene los archivos CSV de Tandem.
        :return: Un diccionario con las claves 'glucose', 'basal', 'bolus' conteniendo los DataFrames procesados.
        """
        try:
            logger.info(f"Iniciando procesamiento de datos Tandem en: {folder_path}")

            # Inicializar diccionario de resultados
            results = {
                "glucose": pd.DataFrame({"time": [], "glucose": []}),
                "basal": pd.DataFrame(),
                "bolus": pd.DataFrame(),
            }

            # Procesar datos de glucosa
            logger.info("=== PROCESANDO DATOS DE GLUCOSA ===")
            cgm_files = self._find_cgm_files(folder_path)

            if cgm_files:
                dataframes = []

                for file_path in cgm_files:
                    logger.info(
                        f"Procesando archivo de glucosa: {os.path.basename(file_path)}"
                    )

                    try:
                        df_raw = pd.read_csv(
                            file_path,
                            header=self.header_row,
                            usecols=[self.date_col, self.glucose_col],
                            sep=",",
                        )

                        df_processed = self._clean_and_standardize(df_raw)

                        if not df_processed.empty:
                            dataframes.append(df_processed)
                            logger.info(
                                f"  - Registros procesados: {len(df_processed)}"
                            )
                        else:
                            logger.warning(
                                "  - Archivo vacío después del procesamiento"
                            )

                    except Exception as e:
                        logger.error(
                            f"  - Error procesando {os.path.basename(file_path)}: {e}"
                        )
                        continue

                if dataframes:
                    df_combined = pd.concat(dataframes, ignore_index=True)
                    df_combined.sort_values(by="time", inplace=True)
                    df_combined.drop_duplicates(
                        subset="time", keep="first", inplace=True
                    )
                    df_combined.reset_index(drop=True, inplace=True)

                    results["glucose"] = df_combined
                    self.glucose_data = df_combined
                    logger.info(
                        f"Total de registros de glucosa combinados: {len(df_combined)}"
                    )
                else:
                    logger.warning(
                        "No se pudieron procesar datos de glucosa de ningún archivo"
                    )
            else:
                logger.warning(
                    f"No se encontraron archivos cgm_data_*.csv en '{folder_path}'"
                )

            # Procesar datos de insulina
            logger.info("=== PROCESANDO DATOS DE INSULINA ===")
            basal_files, bolus_files = self._find_insulin_files(folder_path)

            # Procesar insulina basal
            if basal_files:
                logger.info("Procesando datos de insulina basal")
                try:
                    all_basal_data = []
                    for file_path in basal_files:
                        logger.info(
                            f"Procesando archivo basal: {os.path.basename(file_path)}"
                        )
                        basal_data = self._load_basal_data(file_path)
                        all_basal_data.append(basal_data)

                    if all_basal_data:
                        combined_basal = pd.concat(all_basal_data, ignore_index=True)
                        processed_basal = self._process_basal_intervals(combined_basal)
                        results["basal"] = processed_basal
                        self.basal_data = processed_basal
                        logger.info(
                            f"Datos de insulina basal procesados: {len(processed_basal)} intervalos con duración real"
                        )
                except Exception as e:
                    logger.error(f"Error procesando datos de insulina basal: {e}")
            else:
                logger.warning("No se encontraron archivos de insulina basal")

            # Procesar insulina bolus
            if bolus_files:
                logger.info("Procesando datos de insulina bolus")
                try:
                    all_bolus_data = []
                    for file_path in bolus_files:
                        logger.info(
                            f"Procesando archivo bolus: {os.path.basename(file_path)}"
                        )
                        bolus_data = self._load_bolus_data(file_path)
                        all_bolus_data.append(bolus_data)

                    if all_bolus_data:
                        combined_bolus = pd.concat(all_bolus_data, ignore_index=True)
                        processed_bolus = self._process_bolus_data(combined_bolus)
                        results["bolus"] = processed_bolus
                        self.bolus_data = processed_bolus
                        logger.info(
                            f"Datos de insulina bolus procesados: {len(processed_bolus)} registros"
                        )
                except Exception as e:
                    logger.error(f"Error procesando datos de insulina bolus: {e}")
            else:
                logger.warning("No se encontraron archivos de insulina bolus")

            logger.info("=== PROCESAMIENTO COMPLETADO ===")
            return results

        except Exception as e:
            logger.error(f"Error procesando la carpeta: {e}")
            return {
                "glucose": pd.DataFrame({"time": [], "glucose": []}),
                "basal": pd.DataFrame(),
                "bolus": pd.DataFrame(),
            }


# --- Ejemplo de Uso ---
if __name__ == "__main__":
    # Crea una instancia del procesador
    processor = TandemProcessor()

    # Obtener la ruta del directorio donde está este archivo Python
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construir la ruta a la carpeta Tandem relativa al archivo Python
    ruta_carpeta = os.path.join(script_dir, "Tandem")

    logger.info(f"Buscando archivos en: {ruta_carpeta}")
    logger.info(f"¿Existe la carpeta? {os.path.exists(ruta_carpeta)}")

    # Procesar todos los datos
    results = processor.process(ruta_carpeta)

    glucose_df = results["glucose"]
    basal_df = results["basal"]
    bolus_df = results["bolus"]

    glucose_df.to_csv("glucose_df.csv", index=False)
    basal_df.to_csv("basal_df.csv", index=False)
    bolus_df.to_csv("bolus_df.csv", index=False)

    # Mostrar resultados de glucosa
    logger.info("\n=== DATOS DE GLUCOSA ===")
    logger.info(f"Registros de glucosa: {len(glucose_df)}")
    if not glucose_df.empty:
        logger.info(
            f"Rango de fechas: {glucose_df['time'].min()} a {glucose_df['time'].max()}"
        )
        logger.info(
            f"Rango de glucosa: {glucose_df['glucose'].min()} - {glucose_df['glucose'].max()} mg/dL"
        )
        logger.info("\nPrimeras 5 filas de glucosa:")
        logger.info(f"\n{glucose_df.head()}")
        logger.info("\nÚltimas 5 filas de glucosa:")
        logger.info(f"\n{glucose_df.tail()}")

    # Mostrar resultados de insulina basal
    basal_df = results["basal"]
    logger.info("\n=== DATOS DE INSULINA BASAL ===")
    logger.info(f"Intervalos de insulina basal: {len(basal_df)}")
    if not basal_df.empty:
        logger.info(
            f"Rango de fechas: {basal_df['time'].min()} a {basal_df['time'].max()}"
        )
        logger.info(f"Total insulina basal: {basal_df['insulin_basal_u'].sum():.2f} U")
        logger.info(f"Tasa promedio: {basal_df['rate_uh'].mean():.2f} U/h")
        logger.info("\nPrimeras 5 filas de insulina basal:")
        logger.info(f"\n{basal_df.head()}")

    # Mostrar resultados de insulina bolus
    bolus_df = results["bolus"]
    logger.info("\n=== DATOS DE INSULINA BOLUS ===")
    logger.info(f"Registros de insulina bolus: {len(bolus_df)}")
    if not bolus_df.empty:
        logger.info(
            f"Rango de fechas: {bolus_df['time'].min()} a {bolus_df['time'].max()}"
        )
        logger.info(f"Total insulina bolus: {bolus_df['total_insulin'].sum():.2f} U")
        logger.info(f"Total carbohidratos: {bolus_df['CHO(g)'].sum():.2f} g")
        logger.info("\nPrimeras 5 filas de insulina bolus:")
        logger.info(f"\n{bolus_df.head()}")

    logger.info("\n=== RESUMEN FINAL ===")
    logger.info("Procesamiento completado exitosamente")
    logger.info(f"- Glucosa: {len(glucose_df)} registros")
    logger.info(f"- Insulina basal: {len(basal_df)} intervalos con duración real")
    logger.info(f"- Insulina bolus: {len(bolus_df)} registros")
