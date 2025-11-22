from typing  import Literal ,Optional ,List
from pydantic import BaseModel 


class UserSettings(BaseModel):
    difficulty:Literal["very simple","simple","normal","detailed" ] = "simple"
    profile: List [Literal["dyslexia","dysgraphia","dyscalculia","hearing_impairment"]] = []

class TranscriptChunk(BaseModel):
    session_id:str
    text:str
    start_time: float
    end_time:float
    
class SummaryPayload(BaseModel):
    sesseion_id:str
    simple_txt:str
    expanded_text:str
    notes_for_hearing:str

     
