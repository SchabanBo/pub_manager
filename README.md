# Pub Manager

[Marketplace](https://marketplace.visualstudio.com/items?itemName=qlevar.pub-manager)

Pub Manager is a Visual Studio Code extension that helps you manage packages in your Dart and Flutter projects. With this extension, you can view package information, check for updates, and easily update your pubspec.yaml file.

![Pub Manager](https://github.com/SchabanBo/pub_manager/blob/main/media/pub-manager.png?raw=true)
![Pub Manager](https://github.com/SchabanBo/pub_manager/blob/main/media/pub-manager.gif?raw=true)

## Key Features

- **Package List Display**: View a list of packages from the pubspec.yaml file in a webview panel.
- **Detailed Package Info**: View details such as the current version, latest version, and published date.
- **Update Management**: Check for available updates for each package and perform updates.
- **Automatic Updates**: Automatically update the pubspec.yaml file and run flutter pub get to apply package updates.
- **Package Management**: Add or remove a package directly from the panel.
- **Static Analysis**: Run static analysis on the project to find unused packages and files and get the files count and lines of code count.
- **Licenses Summary**: Show a summary of licenses for the packages used in the project.
- **Update Sorting**: Sort the table by packages with available updates.
- **Git History**: Display git history for each package, showing who and when added/updated the package.
- **Dev Dependencies**: Display dev dependencies in the table.
- **Package Statistics**: Show the number of packages that need to be updated and the total number of packages.
- **Expandable Info**: Click on a package row to expand it, showing more information about it.
- **Resolvable Packages Analysis**: Analyze the resolvable packages in the project.
- **Update All Button**: Add an "Update All" button to update all the packages in the project.
- **Flutter Version Display**: Show the current Flutter version.

## Installation

1. Launch Visual Studio Code.
1. Open the Extensions View: Click on the square icon in the sidebar or press Ctrl+Shift+X.
1. Search for "Pub Manager" and click on the "Install" button.
1. Activate the Extension: Click on the "Reload" button after installation.

## Usage Guide
1. Open a Dart or Flutter Project: Ensure your project contains a pubspec.yaml file.
1. Access Pub Manager:
    - Click on the Pub Manager icon in the VS Code toolbar.
    - Or run the "Pub Manager: Show package list" command from the command palette.
1. View and Manage Packages:
    - The package list will be displayed in a webview panel, showing details like package name, current version, latest version, published date, licenses, update availability, and an update button.
    - Click on the update button for a package to update its version in the pubspec.yaml file.
    - After updating, the pubspec.yaml file will be saved, and flutter pub get will run automatically to apply changes.
    - Use the "Update All" button to update all packages in the project at once.
    - View the current Flutter version in the panel.

## Multi-project Workspace Support

Pub Manager supports multi-project workspaces. For each Dart or Flutter project in your workspace:

1. Open the pubspec.yaml file.
1. Run the "Pub Manager: Show package list" command from the command palette.
1. The extension will display packages for the selected project.

## Contributing

We welcome contributions! To contribute to Pub Manager:

1. Fork the Repository.
1. Clone the Forked Repository: git clone <your-forked-repo-url>
1. Install Dependencies: Use npm install or yarn install.
1. Make Changes and Test: Ensure your changes are thoroughly tested.
1. Create a Pull Request: Explain the purpose of your changes.

## Known Issues
There are no known issues at the moment. If you encounter any problems or have suggestions for improvements, please [open an issue](https://github.com/SchabanBo/pub_manager/issues).

---

Happy coding!
