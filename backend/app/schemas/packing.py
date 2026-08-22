from pydantic import BaseModel


class PackingListResponse(BaseModel):
    season_label: str
    categories: dict[str, list[str]]
    notes: str
