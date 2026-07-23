from app.core.models.email_draft import EmailDraft
from app.core.ports.outbound.gateways.email_drafts import EmailDraftGateway
from app.core.ports.outbound.repositories.workdays import WorkdayRepository
from app.core.ports.outbound.generators.workbook import WorkbookGenerator
from app.core.ports.outbound.mapper.workday import MapWorkday
from app.core.ports.outbound.storage.files import FileStorage


class CreateWorkBook:

    def __init__(
        self,
        repository: WorkdayRepository,
        generator: WorkbookGenerator,
        storage: FileStorage,
        mapper: MapWorkday,
        gateway: EmailDraftGateway,
        emailDraft: EmailDraft,
    ):
        self.repository = repository
        self.generator = generator
        self.storgae = storage
        self.mapper = mapper
        self.gateway = gateway
        self.emailDraft = emailDraft

    def execute_workbook(self, year: int, month: int):

        workdays = self.repository.get_workdays_for_close(year, month)
        mapped_workdays = self.mapper.map(workdays)
        current_workbook = self.storgae.get_excel(year, month)
        new_workbook = self.generator.create_workbook(current_workbook, mapped_workdays)
        filename = self.storgae.save_excel(new_workbook.content, year, month)
        emailResponse = self.gateway.save_draft(
            self.emailDraft, new_workbook.content, filename
        )

        return emailResponse
