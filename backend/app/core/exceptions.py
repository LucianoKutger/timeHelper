class DomainError(Exception):
    code = "domain_error"


class ClarificationRequired(DomainError):
    code = "clarification_required"


class ConflictError(DomainError):
    code = "duplicate_or_conflict"


class EntityNotFound(DomainError):
    code = "entity_not_found"
