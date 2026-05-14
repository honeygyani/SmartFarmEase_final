from typing import Generic, TypeVar, Type, Optional, List, Any
from prisma import Prisma

# ModelType should represent the model name in Prisma, but it's hard to use Generic with Prisma
# as Prisma models are classes and we access them via client.model_name
# So we'll pass the model name (string) or the model's prisma client access point.

class BaseRepository:
    def __init__(self, model_name: str, db: Prisma):
        self.model_name = model_name
        self.db = db
        # Access the model delegate on the prisma client
        self.model_delegate = getattr(self.db, model_name)

    async def get(self, id: Any) -> Optional[Any]:
        return await self.model_delegate.find_unique(where={"id": id})

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[Any]:
        return await self.model_delegate.find_many(skip=skip, take=limit, order={"id": "desc"})

    async def create(self, data: dict) -> Any:
        return await self.model_delegate.create(data=data)

    async def update(self, id: Any, data: dict) -> Any:
        return await self.model_delegate.update(where={"id": id}, data=data)

    async def delete(self, id: Any) -> Optional[Any]:
        return await self.model_delegate.delete(where={"id": id})
