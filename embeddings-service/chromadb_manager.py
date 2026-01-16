"""
ChromaDB Manager - Gestión de base de datos vectorial
Maneja todas las operaciones CRUD con ChromaDB para el sistema de aprendizaje
"""

import chromadb
from chromadb.config import Settings
from typing import List, Optional, Tuple, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)

class ChromaDBManager:
    """Gestor de ChromaDB para almacenamiento y búsqueda de embeddings"""

    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Inicializar ChromaDB con persistencia local

        Args:
            persist_directory: Directorio para almacenar datos de ChromaDB
        """
        self.persist_directory = persist_directory
        self.collection_name = "conversations"

        try:
            # Crear directorio si no existe
            os.makedirs(persist_directory, exist_ok=True)

            # Inicializar cliente con persistencia
            self.client = chromadb.PersistentClient(
                path=persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )

            # Obtener o crear colección
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={
                    "description": "Conversaciones del chatbot para aprendizaje",
                    "hnsw:space": "cosine"  # Usar similitud coseno
                }
            )

            logger.info(f"ChromaDB initialized at {persist_directory}")
            logger.info(f"Collection '{self.collection_name}' ready with {self.collection.count()} items")

        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def health_check(self) -> bool:
        """Verificar que ChromaDB está funcionando"""
        try:
            # Intentar obtener conteo de la colección
            count = self.collection.count()
            return True
        except Exception as e:
            logger.error(f"ChromaDB health check failed: {e}")
            return False

    def add(
        self,
        id: str,
        embedding: List[float],
        document: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Agregar un embedding a la colección

        Args:
            id: ID único (mismo que en SQLite)
            embedding: Vector de embedding
            document: Texto del documento (respuesta del bot)
            metadata: Metadata adicional

        Returns:
            ID del embedding guardado
        """
        try:
            self.collection.add(
                ids=[id],
                embeddings=[embedding],
                documents=[document],
                metadatas=[metadata] if metadata else None
            )
            logger.info(f"Added embedding with id: {id}")
            return id
        except Exception as e:
            # Si ya existe, actualizar
            if "already exists" in str(e).lower():
                return self.update(id, embedding, document, metadata)
            logger.error(f"Error adding embedding: {e}")
            raise

    def update(
        self,
        id: str,
        embedding: Optional[List[float]] = None,
        document: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Actualizar un embedding existente

        Args:
            id: ID del embedding
            embedding: Nuevo vector (opcional)
            document: Nuevo documento (opcional)
            metadata: Nueva metadata (opcional)

        Returns:
            ID del embedding actualizado
        """
        try:
            update_args = {"ids": [id]}

            if embedding:
                update_args["embeddings"] = [embedding]
            if document:
                update_args["documents"] = [document]
            if metadata:
                update_args["metadatas"] = [metadata]

            self.collection.update(**update_args)
            logger.info(f"Updated embedding with id: {id}")
            return id
        except Exception as e:
            logger.error(f"Error updating embedding: {e}")
            raise

    def update_metadata(self, id: str, metadata: Dict[str, Any]) -> bool:
        """
        Actualizar solo la metadata de un embedding

        Args:
            id: ID del embedding
            metadata: Metadata a actualizar/agregar

        Returns:
            True si se actualizó correctamente
        """
        try:
            # Obtener metadata existente
            result = self.collection.get(ids=[id], include=["metadatas"])

            if not result["ids"]:
                return False

            # Mezclar metadata existente con nueva
            existing_metadata = result["metadatas"][0] if result["metadatas"] else {}
            updated_metadata = {**existing_metadata, **metadata}

            self.collection.update(
                ids=[id],
                metadatas=[updated_metadata]
            )
            logger.info(f"Updated metadata for id: {id}")
            return True
        except Exception as e:
            logger.error(f"Error updating metadata: {e}")
            return False

    def delete(self, id: str) -> bool:
        """
        Eliminar un embedding

        Args:
            id: ID del embedding a eliminar

        Returns:
            True si se eliminó correctamente
        """
        try:
            self.collection.delete(ids=[id])
            logger.info(f"Deleted embedding with id: {id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting embedding: {e}")
            return False

    def search(
        self,
        query_embedding: List[float],
        n_results: int = 5,
        filter_helpful: Optional[bool] = None
    ) -> List[Tuple[str, str, Dict, float]]:
        """
        Buscar embeddings similares

        Args:
            query_embedding: Embedding de la query
            n_results: Número de resultados a retornar
            filter_helpful: Filtrar por respuestas útiles (opcional)

        Returns:
            Lista de tuplas (id, document, metadata, distance)
        """
        try:
            # Construir filtro si es necesario
            where_filter = None
            if filter_helpful is not None:
                where_filter = {"was_helpful": filter_helpful}

            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter,
                include=["documents", "metadatas", "distances"]
            )

            # Formatear resultados
            formatted = []
            if results and results["ids"]:
                for i in range(len(results["ids"][0])):
                    formatted.append((
                        results["ids"][0][i],
                        results["documents"][0][i] if results["documents"] else "",
                        results["metadatas"][0][i] if results["metadatas"] else {},
                        results["distances"][0][i] if results["distances"] else 0
                    ))

            return formatted
        except Exception as e:
            logger.error(f"Error searching: {e}")
            return []

    def get(self, id: str) -> Optional[Dict]:
        """
        Obtener un embedding por ID

        Args:
            id: ID del embedding

        Returns:
            Diccionario con datos del embedding o None
        """
        try:
            result = self.collection.get(
                ids=[id],
                include=["documents", "metadatas", "embeddings"]
            )

            if result["ids"]:
                return {
                    "id": result["ids"][0],
                    "document": result["documents"][0] if result["documents"] else None,
                    "metadata": result["metadatas"][0] if result["metadatas"] else None,
                    "embedding": result["embeddings"][0] if result["embeddings"] else None
                }
            return None
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            return None

    def get_stats(self) -> Dict[str, Any]:
        """
        Obtener estadísticas de la colección

        Returns:
            Diccionario con estadísticas
        """
        try:
            count = self.collection.count()

            return {
                "total_embeddings": count,
                "collection_name": self.collection_name,
                "persist_directory": self.persist_directory
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {}

    def reset(self) -> bool:
        """
        Resetear la colección (eliminar todos los datos)

        Returns:
            True si se reseteó correctamente
        """
        try:
            self.client.delete_collection(self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={
                    "description": "Conversaciones del chatbot para aprendizaje",
                    "hnsw:space": "cosine"
                }
            )
            logger.info("Collection reset successfully")
            return True
        except Exception as e:
            logger.error(f"Error resetting collection: {e}")
            return False

    def get_all(self, limit: int = 100) -> List[Dict]:
        """
        Obtener todos los embeddings (con límite)

        Args:
            limit: Número máximo de resultados

        Returns:
            Lista de diccionarios con datos de embeddings
        """
        try:
            result = self.collection.get(
                limit=limit,
                include=["documents", "metadatas"]
            )

            items = []
            if result["ids"]:
                for i in range(len(result["ids"])):
                    items.append({
                        "id": result["ids"][i],
                        "document": result["documents"][i] if result["documents"] else None,
                        "metadata": result["metadatas"][i] if result["metadatas"] else None
                    })

            return items
        except Exception as e:
            logger.error(f"Error getting all embeddings: {e}")
            return []
