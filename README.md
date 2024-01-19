# Pub Manager

[Marketplace](https://marketplace.visualstudio.com/items?itemName=qlevar.pub-manager)

Pub Manager is a Visual Studio Code extension that helps you manage packages in your Dart and Flutter projects. With this extension, you can view package information, check for updates, and easily update your `pubspec.yaml` file.

![Pub Manager](https://github.com/SchabanBo/pub_manager/blob/main/media/pub-manager.png?raw=true)
![Pub Manager](https://github.com/SchabanBo/pub_manager/blob/main/media/pub-manager.gif?raw=true)

## Features

- Display a list of packages from the `pubspec.yaml` file in a webview panel.
- View package details such as the current version, latest version, and published date.
- Check for available updates for each package and perform updates.
- Automatically update the `pubspec.yaml` file and run `flutter pub get` to apply package updates.
- Add or remove a package directly from the panel.
- Run static analysis on the project to find unused packages and files and get the files count and lines of code count.
- **Show a summary of licenses for the packages used in the project.**
- **Sort the table by packages with available updates.**
- **Display git history for each package, showing who and when added/updated the package.**
- **Display dev dependencies in the table.**
- **Show the number of packages that need to be updated and the total number of packages.**
- **Clicking on a package row will expand it, showing more information about it.**

## Installation

1. Launch Visual Studio Code.
2. Open the Extensions view by clicking on the square icon in the sidebar or by pressing `Ctrl+Shift+X`.
3. Search for "Pub Manager" and click on the "Install" button.
4. Once the installation is complete, click on the "Reload" button to activate the extension.

## Usage

1. Open a Dart or Flutter project that contains a `pubspec.yaml` file.
2. In the VS Code toolbar, click on the Pub Manager icon to open the panel. or run the "Pub Manager: Show package list" command from the command palette.
3. The package list will be displayed in a webview panel, showing the package name, current version, latest version, published date, licenses, update availability, and an update button.
4. Click on the update button for a package to update its version in the `pubspec.yaml` file.
5. After the update, the `pubspec.yaml` file will be saved, and `flutter pub get` will be automatically run to apply the changes.

## Multi-project Support

Pub Manager supports multi-project workspaces. If you have multiple Dart or Flutter projects in your workspace, open the `pubspec.yaml` file of that project and run the "Pub Manager: Show package list" command from the command palette. The extension will open the packages in that project.

## Contributing

We welcome contributions! To contribute to Pub Manager, please follow these steps:

1. Fork the repository.
2. Clone the forked repository to your local machine.
3. Install dependencies using `npm install` or `yarn install`.
4. Make your changes and test them thoroughly.
5. Create a pull request, explaining the purpose of your changes.

For more details, please read our [contribution guidelines](CONTRIBUTING.md).

## Known Issues

- There are no known issues at the moment. If you encounter any problems or have suggestions for improvements, please [open an issue](https://github.com/SchabanBo/pub_manager/issues).

---

Happy coding!
