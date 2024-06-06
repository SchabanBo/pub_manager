# Change Log

## [0.5.1]

### Changed

- Update Readme file

## [0.5.0]

### Added

- Analyze the resolvable packages in the project .
- Add update all button to update all the packages in the project.
- Show the current flutter version.

### Fixed

- Fix the issue when updating a package containing something after the version number (1.0.1+5 or 1.0.0-beta).

## [0.4.0]

### Added

- Show a summery for the Licenses of the packages that are used in the project.
- the ability to sort the table by the packages, that have an update available
- Show the git history for the packages (who and when added/updated the package)
- Show the dev dependencies in the table
- Add the number of the packages need to be updated and the total number of the packages.

## [0.3.1]

### Added
- #7 add sortable columns. [@aditgpt]

## [0.3.0]

### Added
- #5 Display supported platforms
- #6 adds support for multi project in a workspaces.

## [0.2.0]

### Added
- #3 use font size from settings.

### Changed

### Fixed
- #2 fix the issue when package name contains number.

## [0.1.0]

### Added
- display project name in the toolbar.
- added a "Refresh" button to update the panel content.
- added an "Analyze Project" button to run a static analyzer on the project.
- add the logic for displaying unused packages and files.
- show files count and lines of code count.
- improved styling for buttons and results display.
- a remove button to remove package.
- add button that will run `Dart: Add Dependency` command.

### Changed
- move the open panel button from pubspec.yaml to the toolbar.

### Fixed
- Fix #1
- '^' will not be removed from the version constraint.

## [0.0.4]

- First release of Pub Manager.
