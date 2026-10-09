# Offline Log Workbench

Offline Log Workbench is a lightweight, browser-based log viewer for making **small to medium-sized local test and development log files** easier to read, inspect, filter, and analyze.

It runs locally in a web browser. Log files are processed in the browser and are not uploaded to a server.

## Purpose

This tool is intended for situations such as:

- Checking application logs during local development
- Investigating a local test run
- Finding slow operations in a log
- Looking for errors or warnings
- Comparing processing times between log lines
- Quickly filtering a development log without opening it in a text editor

It is intentionally designed for **logs that are not extremely large**. It is a readability and investigation tool, not a replacement for a large-scale log platform.

## How to use

1. Open `index.html` directly in a supported desktop browser.
2. Open a text or log file, or drag and drop it into the application.
3. The application analyzes the log locally.
4. The detected log lines are displayed in a structured table.
5. Use the sidebar filters, message keyword search, sorting, timestamp display format, and table controls to investigate the log.

No web server is required for normal local use.

## Main features

### Automatic timestamp detection

The application automatically detects timestamp information from log text.

It supports common timestamp representations and determines the timestamp format from the actual log content rather than requiring the user to configure the format first.

The detected timestamp is used to calculate the elapsed time between consecutive log entries.

### Elapsed-time analysis

For each log line, the application calculates the elapsed time from the previous timestamp when timestamps are available.

Elapsed time is displayed in a human-readable form such as:

- `+12ms`
- `+0.5s`
- `+1.2s`
- `+2m 10s`

This makes unusually slow processing immediately visible.

### Performance statistics

The sidebar provides summary information for the currently loaded log, including:

- Average elapsed time
- Median elapsed time
- Maximum elapsed time
- A high-latency reference value for identifying unusually slow processing

The statistics update when filtering conditions change so that the displayed values correspond to the currently relevant log entries.

### Slow-processing detection

A configurable slow-processing threshold can be specified in milliseconds.

For example, entering `1000` means that elapsed times of one second or longer are treated as slow.

This makes it possible to quickly identify operations that exceed the expected processing time.

### Log-level filtering

The log can be filtered by detected log level, including common levels such as:

- DEBUG
- INFO
- WARN / WARNING
- ERROR
- FATAL
- TRACE

Multiple levels can be selected simultaneously.

### Message keyword filtering

A keyword field is available directly in the Message header.

The keyword filter searches the message content and highlights matching text so that relevant portions of the log are easy to find.

The keyword field is localized with the application language.

### Sorting

Sorting is available next to the display controls.

The log can be sorted by:

- Original line order
- Elapsed time descending
- Elapsed time ascending
- Timestamp ascending
- Timestamp descending
- Log level

Sorting changes the displayed order without changing the original log file.

### Timestamp display formats

The detected timestamp is preserved as source data, while its display can be changed.

Available display styles include:

- `YYYY-MM-DD HH:mm:ss.SSS`
- `YYYY/MM/DD HH:mm:ss.SSS`
- Original timestamp representation

The display format does not modify the original log content.

### Reset display

The display can be reset to the normal view after applying filters or sorting.

Resetting the display does not modify the source log file.

### Copy displayed data

The currently displayed table contents can be copied in tab-separated form.

This is useful for pasting the filtered result into:

- Excel
- Google Sheets
- A text editor
- A ticket or issue tracker
- Other tabular tools

Only the currently displayed data is copied.

### Table interaction

The log is presented as a structured table so that columns can be inspected independently.

Where supported by the current view, table display controls make it easier to work with long messages and timestamp information without modifying the source file.

### Loading indicator

Operations that may take noticeable time, such as loading and analyzing a log, display a loading indicator.

This makes it clear that the browser is processing the log rather than waiting for additional user input.

## Supported log content

The tool is designed for ordinary text-based application and test logs.

Examples include:

```text
2026-09-23 10:00:00.000 INFO Starting test
2026-09-23 10:00:00.125 INFO Loading configuration
2026-09-23 10:00:01.842 WARN Slow response
2026-09-23 10:00:02.010 ERROR Request failed
```

It can also handle logs where the timestamp appears elsewhere in a line, depending on whether the timestamp pattern can be detected reliably.

Logs may contain mixed levels such as:

```text
INFO
WARN
ERROR
FATAL
```

Error identifiers such as `E-001`, `E-404`, or other application-specific codes can remain part of the message and can be located using the keyword search.

## Filter and context behavior

Filters are applied in this order:

1. **Keyword filter** — defines the investigation set. For example, `user=u001` leaves only `u001` log rows in the investigation set.
2. **Error / Warning / Slow filters** — select target rows from that investigation set.
3. **Context rows** — expand each target row by the requested number of rows **within the keyword-filtered investigation set**.

For example, with `user=u001`, `ERROR`, and context `5`, the viewer shows the matching `u001` error rows plus the surrounding `u001` log entries. Logs belonging to other users are not pulled into the context just because they are physically adjacent in the original file.

The context count therefore refers to rows in the keyword-filtered set, not raw physical line numbers in the source file.

## Localization

The interface supports Japanese and English.

Japanese is the default language.

Language selection changes interface labels, buttons, filters, headers, settings, and search-related text.

## Themes

The application provides theme settings for comfortable viewing in different environments.

Theme settings can be changed independently from the log content.

## Privacy and network behavior

The application is designed for local use.

- Log files are processed in the browser.
- The log content is not intentionally uploaded to a server.
- No external log analysis service is required.
- No network connection is required for normal log viewing and analysis.

Because the tool is intended to be used locally, it is suitable for development logs that should remain on the user's machine.

## File scope and limitations

Offline Log Workbench is intended for **non-massive local logs**, especially logs generated during development and testing.

It is not intended to replace:

- Elasticsearch / OpenSearch
- Splunk
- Datadog
- Cloud logging platforms
- Large-scale log ingestion pipelines
- Distributed trace analysis systems

Extremely large files may require substantial browser memory and CPU time.

For very large production logs, use a dedicated log analysis system or process the data before opening it in this tool.

## Offline project structure

A typical project contains:

```text
offline-log-workbench/
├─ index.html
├─ README.md
├─ assets/
│  └─ favicon.svg
├─ css/
├─ js/
└─ vendor/
```

All files required for the local application are kept within the project.

## Browser usage

The application is intended for modern desktop browsers such as:

- Google Chrome
- Microsoft Edge

The normal usage model is to open `index.html` locally and then load a text or log file.

## Design goal

The goal of Offline Log Workbench is simple:

> Make an ordinary local development or test log much easier to read and investigate without requiring a server or a dedicated log platform.

It focuses on timestamp analysis, elapsed-time visibility, error/level filtering, keyword search, sorting, statistics, and convenient table-based inspection.
