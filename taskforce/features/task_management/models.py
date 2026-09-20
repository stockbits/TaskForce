from pydantic import BaseModel, ConfigDict, Field


class Task(BaseModel):
    """Typed internal view of the existing task JSON contract."""

    model_config = ConfigDict(extra="ignore", frozen=True, populate_by_name=True)

    task_identifier: str = Field(validation_alias="taskId")
    division: str
    status: str = Field(validation_alias="taskStatus")
    planning_work_area: str = Field(default="", validation_alias="pwa")
    task_type: str = Field(default="", validation_alias="taskType")
    primary_skill: str = Field(default="", validation_alias="primarySkill")
    capabilities: tuple[str, ...] = ()
    importance_score: int = Field(default=0, validation_alias="importanceScore")
    employee_identifier: str | None = Field(
        default=None,
        validation_alias="employeeId",
    )
    resource_name: str | None = Field(default=None, validation_alias="resourceName")
    asset_name: str = Field(default="", validation_alias="assetName")
    domain_identifier: str = Field(default="", validation_alias="domain")
    description: str = ""
    response_code: str = Field(default="", validation_alias="responseCode")
    postcode: str = Field(default="", validation_alias="postCode")
    customer_address: str = Field(default="", validation_alias="customerAddress")
    commitment_type: str = Field(default="", validation_alias="commitmentType")
    expected_start: str = Field(default="", validation_alias="expectedStartDate")
    expected_finish: str = Field(default="", validation_alias="expectedFinishDate")
    external_queue_identifier: str = Field(
        default="",
        validation_alias="externalQueueId",
    )
    work_identifier: str = Field(default="", validation_alias="workId")
    estimate_number: str = Field(default="", validation_alias="estimateNumber")
