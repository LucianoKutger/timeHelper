from datetime import date
from urllib import response

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
    ):
        self.repository = repository
        self.generator = generator
        self.storgae = storage
        self.mapper = mapper

    def execute_workbook(self, year: int, month: int):

        workdays = self.repository.get_workdays_for_close(year, month)
        mapped_workdays = self.mapper.map(workdays)
        current_workbook = self.storgae.get_excel(year, month)
        new_workbook = self.generator.create_workbook(current_workbook, mapped_workdays)
        response = self.storgae.save_excel(new_workbook.content, year, month)

        return response
