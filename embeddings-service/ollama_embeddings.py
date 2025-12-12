"""
Ollama Embeddings - Generación de embeddings con Ollama local
Usa el modelo nomic-embed-text para generar vectores de 768 dimensiones
"""

import httpx
from typing import List, Optional
import logging
import asyncio

logger = logging.getLogger(__name__)

class OllamaEmbeddings:
    """Gestor de embeddings usando Ollama local"""

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model_name: str = "nomic-embed-text"
    ):
        """
        Inicializar cliente de Ollama

        Args:
            base_url: URL del servidor Ollama
            model_name: Nombre del modelo de embeddings
        """
        self.base_url = base_url
        self.model_name = model_name
        self.embed_endpoint = f"{base_url}/api/embeddings"
        self.timeout = 30.0  # 30 segundos timeout

        logger.info(f"OllamaEmbeddings initialized - Model: {model_name}")

    async def health_check(self) -> bool:
        """
        Verificar que Ollama está disponible y el modelo cargado

        Returns:
            True si Ollama está funcionando
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Verificar que Ollama está corriendo
                response = await client.get(f"{self.base_url}/api/tags")

                if response.status_code == 200:
                    data = response.json()
                    models = [m["name"] for m in data.get("models", [])]

                    # Verificar que el modelo de embeddings está disponible
                    if any(self.model_name in m for m in models):
                        logger.info(f"Ollama health check passed - {self.model_name} available")
                        return True
                    else:
                        logger.warning(f"Model {self.model_name} not found. Available: {models}")
                        logger.info(f"Run: ollama pull {self.model_name}")
                        return False

                return False
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generar embedding para un texto

        Args:
            text: Texto a convertir en embedding

        Returns:
            Lista de floats representando el embedding (768 dimensiones)
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.embed_endpoint,
                    json={
                        "model": self.model_name,
                        "prompt": text.strip()
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    embedding = data.get("embedding", [])

                    if not embedding:
                        raise ValueError("Empty embedding returned from Ollama")

                    logger.debug(f"Generated embedding with {len(embedding)} dimensions")
                    return embedding
                else:
                    error_msg = f"Ollama returned status {response.status_code}: {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)

        except httpx.TimeoutException:
            logger.error(f"Timeout generating embedding for text: {text[:50]}...")
            raise Exception("Ollama request timed out")
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    async def generate_embeddings_batch(
        self,
        texts: List[str],
        batch_size: int = 10
    ) -> List[List[float]]:
        """
        Generar embeddings para múltiples textos

        Args:
            texts: Lista de textos
            batch_size: Tamaño del lote para procesamiento

        Returns:
            Lista de embeddings
        """
        embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            # Procesar batch en paralelo
            tasks = [self.generate_embedding(text) for text in batch]
            batch_embeddings = await asyncio.gather(*tasks, return_exceptions=True)

            for j, result in enumerate(batch_embeddings):
                if isinstance(result, Exception):
                    logger.error(f"Error in batch item {i+j}: {result}")
                    # Usar embedding vacío como fallback
                    embeddings.append([0.0] * 768)
                else:
                    embeddings.append(result)

            logger.info(f"Processed batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")

        return embeddings

    async def pull_model(self) -> bool:
        """
        Descargar el modelo de embeddings si no está disponible

        Returns:
            True si el modelo está disponible
        """
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 min timeout
                response = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": self.model_name},
                    timeout=300.0
                )

                if response.status_code == 200:
                    logger.info(f"Model {self.model_name} pulled successfully")
                    return True
                else:
                    logger.error(f"Failed to pull model: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Error pulling model: {e}")
            return False

    def get_model_info(self) -> dict:
        """
        Obtener información del modelo

        Returns:
            Diccionario con información del modelo
        """
        return {
            "model_name": self.model_name,
            "base_url": self.base_url,
            "dimensions": 768,  # nomic-embed-text default
            "description": "Embedding model optimized for semantic search"
        }


# Función helper para uso síncrono
def generate_embedding_sync(text: str, model_name: str = "nomic-embed-text") -> List[float]:
    """
    Wrapper síncrono para generar embeddings

    Args:
        text: Texto a convertir
        model_name: Modelo a usar

    Returns:
        Lista de floats del embedding
    """
    import asyncio

    ollama = OllamaEmbeddings(model_name=model_name)

    # Obtener o crear event loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(ollama.generate_embedding(text))
