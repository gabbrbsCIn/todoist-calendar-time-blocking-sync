const TODOIST_TOKEN = "your_todoist_api_token_here";
const FILTER_ID = "your_filter_id_here";
const QUERY_PREFIX = "today & ("; 
const NO_EVENT_QUERY = "@noevent"
const TODOIST_API_URL = "https://api.todoist.com/sync/v8/sync";

function updateContext() {
  const currentEvents = getCurrentEvents();
    if (currentEvents.length === 0) {
    Logger.log("No events are happening now.");
    updateFilter(NO_EVENT_QUERY);
    return;
  }

  Logger.log("Events found: " + currentEvents.join(", "));

  if (currentEvents.length === 0) {
    Logger.log("No event mapped.");
    updateFilter(NO_EVENT_QUERY);
    return;
  }
  const uniqueLabels = [...new Set(currentEvents)];
  const labelsString = uniqueLabels.map(l => "@" + l).join(" | ");
  const newQuery = QUERY_PREFIX + labelsString + ")";
  updateFilter(newQuery);
}

function getCurrentEvents() {
  const now = new Date();
  const events = CalendarApp.getDefaultCalendar().getEventsForDay(now);
  const foundEvents = [];
  
  for (let event of events) {
    if (event.isAllDayEvent()) continue;

    if (now >= event.getStartTime() && now <= event.getEndTime()) {
      foundEvents.push(event.getTitle());
    }
  };
  return foundEvents;
}

function updateFilter(newQuery) {
  const url = TODOIST_API_URL;

  const uuid = Utilities.getUuid();

  const commands = [{
    "type": "filter_update",
    "uuid": uuid,
    "args": {
      "id": FILTER_ID,
      "query": newQuery
    }
  }];

  const payload = {
    commands: JSON.stringify(commands) 
  };

  const params = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + TODOIST_TOKEN
    },
    payload: payload, 
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    const responseText = response.getContentText();
    const json = JSON.parse(responseText);

    if (json.sync_status && json.sync_status[uuid] === "ok") {
      Logger.log(`Filter updated to: "${newQuery}"`);
    } else {
      Logger.log(`Response: ${responseText}`);
    }

  } catch (e) {
    Logger.log(`${e.toString()}`);
  }
}
