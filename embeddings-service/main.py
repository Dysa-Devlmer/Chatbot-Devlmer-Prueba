"""
Embeddings Service - Sistema de Aprendizaje Continuo
FastAPI server para gestionar ChromaDB y generar embeddings con Ollama

Puerto: 8001
Endpoints:
  - GET /health - Estado del servicio
  - POST /embed - Generar embedding para texto
  - POST /search - Buscar conversaciones similares
  - POST /store - Guardar conversación con embedding
  - DELETE /delete/{id} - Eliminar embedding
  - GET /stats - Estadísticas del sistema
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime

from chromadb_manager import ChromaDBManager
from ollama_embeddings import OllamaEmbeddings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="Embeddings Service",
    description="Sistema de Aprendizaje Continuo para Chatbot JARVIS",
    version="1.0.0"
)

# CORS para permitir llamadas desde Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar servicios
chroma = ChromaDBManager()
ollama = OllamaEmbeddings()

# ==========================================
# MODELOS PYDANTIC
# ==========================================

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]
    model: str
    dimensions: int

class SearchRequest(BaseModel):
    query: str
    n_results: int = 5
    filter_helpful: Optional[bool] = None  # Filtrar solo respuestas útiles

class SearchResult(BaseModel):
    id: str
    user_message: str
    bot_response: str
    similarity: float
    was_helpful: Optional[bool]
    metadata: dict

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str
    total_found: int

class StoreRequest(BaseModel):
    id: str  # ID de ConversationLearning en SQLite
    user_message: str
    bot_response: str
    was_helpful: Optional[bool] = None
    intent: Optional[str] = None
    category: Optional[str] = None
    user_phone: Optional[str] = None

class StoreResponse(BaseModel):
    success: bool
    vector_id: str
    message: str

class StatsResponse(BaseModel):
    total_embeddings: int
    collection_name: str
    embedding_model: str
    embedding_dimensions: int
    ollama_status: str
    chromadb_status: str

# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "service": "Embeddings Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Verificar estado del servicio"""
    ollama_ok = await ollama.health_check()
    chroma_ok = chroma.health_check()

    return {
        "status": "healthy" if (ollama_ok and chroma_ok) else "degraded",
        "ollama": "connected" if ollama_ok else "disconnected",
        "chromadb": "connected" if chroma_ok else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/embed", response_model=EmbedResponse)
async def generate_embedding(request: EmbedRequest):
    """Generar embedding para un texto"""
    try:
        embedding = await ollama.generate_embedding(request.text)
        return EmbedResponse(
            embedding=embedding,
            model=ollama.model_name,
            dimensions=len(embedding)
        )
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search_similar(request: SearchRequest):
    """Buscar conversaciones similares"""
    try:
        # Generar embedding de la query
        query_embedding = await ollama.generate_embedding(request.query)

        # Buscar en ChromaDB
        results = chroma.search(
            query_embedding=query_embedding,
            n_results=request.n_results,
            filter_helpful=request.filter_helpful
        )

        # Formatear resultados
        formatted_results = []
        for i, (id, doc, metadata, distance) in enumerate(results):
            # Convertir distancia a similaridad (1 - distancia normalizada)
            similarity = max(0, 1 - (distance / 2))

            formatted_results.append(SearchResult(
                id=id,
                user_message=metadata.get("user_message", ""),
                bot_response=doc,
                similarity=round(similarity, 4),
                was_helpful=metadata.get("was_helpful"),
                metadata=metadata
            ))

        return SearchResponse(
            results=formatted_results,
            query=request.query,
            total_found=len(formatted_results)
        )
    except Exception as e:
        logger.error(f"Error searching: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/store", response_model=StoreResponse)
async def store_conversation(request: StoreRequest):
    """Guardar conversación con su embedding"""
    try:
        # Generar embedding del mensaje del usuario
        embedding = await ollama.generate_embedding(request.user_message)

        # Preparar metadata
        metadata = {
            "user_message": request.user_message,
            "was_helpful": request.was_helpful,
            "intent": request.intent,
            "category": request.category,
            "user_phone": request.user_phone,
            "timestamp": datetime.now().isoformat()
        }

        # Filtrar None values
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Guardar en ChromaDB
        vector_id = chroma.add(
            id=request.id,
            embedding=embedding,
            document=request.bot_response,
            metadata=metadata
        )

        return StoreResponse(
            success=True,
            vector_id=vector_id,
            message="Conversación guardada exitosamente"
        )
    except Exception as e:
        logger.error(f"Error storing conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete/{id}")
async def delete_embedding(id: str):
    """Eliminar embedding por ID"""
    try:
        success = chroma.delete(id)
        if success:
            return {"success": True, "message": f"Embedding {id} eliminado"}
        else:
            raise HTTPException(status_code=404, detail="Embedding no encontrado")
    except Exception as e:
        logger.error(f"Error deleting embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update/{id}")
async def update_feedback(id: str, was_helpful: bool):
    """Actualizar feedback de una conversación"""
    try:
        success = chroma.update_metadata(id, {"was_helpful": was_helpful})
        if success:
            return {"success": True, "message": f"Feedback actualizado para {id}"}
        else:
            raise HTTPException(status_code=404, detail="Embedding no encontrado")
    except Exception as e:
        logger.error(f"Error updating feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Obtener estadísticas del sistema"""
    try:
        ollama_ok = await ollama.health_check()
        chroma_stats = chroma.get_stats()

        return StatsResponse(
            total_embeddings=chroma_stats.get("total_embeddings", 0),
            collection_name=chroma_stats.get("collection_name", "conversations"),
            embedding_model=ollama.model_name,
            embedding_dimensions=768,  # nomic-embed-text default
            ollama_status="connected" if ollama_ok else "disconnected",
            chromadb_status="connected" if chroma_stats else "disconnected"
        )
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# STARTUP / SHUTDOWN
# ==========================================

@app.on_event("startup")
async def startup_event():
    """Inicialización al arrancar"""
    logger.info("Starting Embeddings Service...")

    # Verificar conexión con Ollama
    if await ollama.health_check():
        logger.info(f"Ollama connected - Model: {ollama.model_name}")
    else:
        logger.warning("Ollama not available - embeddings will fail")

    # Verificar ChromaDB
    if chroma.health_check():
        stats = chroma.get_stats()
        logger.info(f"ChromaDB connected - {stats.get('total_embeddings', 0)} embeddings")
    else:
        logger.warning("ChromaDB initialization failed")

    logger.info("Embeddings Service ready on port 8001")

@app.on_event("shutdown")
async def shutdown_event():
    """Limpieza al cerrar"""
    logger.info("Shutting down Embeddings Service...")

# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
