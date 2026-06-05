# pict-section-clone

Embeddable Pict view for managing data-mapper Clone configurations: a full-table
copy from one beacon to another, with CRUD plus a Run action. Used to mirror
customer-installed data into a lake.

It is one of the retold-data-mapper UI sections, next to pict-section-mapping,
pict-section-operation, and pict-section-dashboard.

## Status

Early (0.0.1). The view and its data binding work; a worked example and tests
are still to come. The three sibling sections are further along if you need a
wiring reference.

## Install

```bash
npm install pict-section-clone
```

## Usage

The section renders into a Pict application and binds to the retold-data-mapper
REST surface. Register it like any other pict-section view and point it at a
data-mapper beacon; the Run action triggers the full-table copy and reports the
row count.

## License

MIT
