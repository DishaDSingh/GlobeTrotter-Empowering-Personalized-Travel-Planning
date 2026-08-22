import enum


class TripVisibility(str, enum.Enum):
    private = "private"
    public = "public"


class TripStatus(str, enum.Enum):
    draft = "draft"
    planned = "planned"
    completed = "completed"


class ActivityCategory(str, enum.Enum):
    attraction = "Attraction"
    museum = "Museum"
    food = "Food"
    adventure = "Adventure"
    nature = "Nature"
    shopping = "Shopping"
    entertainment = "Entertainment"
    culture = "Culture"
    religious = "Religious"
    nightlife = "Nightlife"


class BudgetCategory(str, enum.Enum):
    transportation = "Transportation"
    accommodation = "Accommodation"
    activities = "Activities"
    food = "Food"
    shopping = "Shopping"
    other = "Other"


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class CollaboratorRole(str, enum.Enum):
    viewer = "viewer"
    editor = "editor"
