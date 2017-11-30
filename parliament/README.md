# Moloch Parliament
Moloch Parliament is an [AngularJS][angularjs] web app to view multiple Moloch clusters.


### Development
The app uses a number of node.js tools for initialization and testing. You must have node.js and its package manager (npm) installed. You can get them from [http://nodejs.org/][node].


### Install Dependencies
The app uses dependencies that are all bundled using [webpack][webpack].

* We get dependencies via `npm`, the [node package manager][npm].

In the app directory, execute:

```
npm install
```

You should find that you have a new folder:

* `node_modules` - contains the npm packages for the dependencies


### Run the Application
#### Production
To start the app for production, simply run:
```
npm start -- --password=somepassword --port=8765 --file=./absolute/file/path
```
This command starts the app, passing in the password, port, and file location, and bundles the application files into `viewer/bundles/app.bundle.js` and `viewer/bundles/vendor.bundle.js`.

* `--password` defines the password that you will use to login to update the parliament. **Defaults to 'admin'**.
* `--port` defines the port that the web app with be listening on. **Defaults to 8008**.
* `--file` defines the absolute path to the JSON file containing your parliament information. **Defaults to './parliament.json'**.

_Note: if you do not pass in the password, port, or file arguments, the defaults are used._

Now browse to the app at `http://localhost:8765`, or whichever port you passed into the `npm start` command.

To login, use the password that you passed into the `npm start` command.


#### Development

To start the app for development and testing, simply run:
```
npm run dev
```

This command starts the app with the necessary flags set (`--password=admin --port=8008 --file=./parliament.json`) and bundles the application files into `viewer/bundles/app.bundle.js` and `viewer/bundles/vendor.bundle.js`.

Webpack watches for changes to relevant files, and re-bundles the app after each save.

Now browse to the app at `http://localhost:8008`.

To login, use the password, 'admin'


### Directory Layout
```
app/                  --> all of the source files for the application
  app.js                --> main application module
  app.css               --> main stylesheet - imports other stylesheets
  index.js              --> client page functionality
  index.html            --> angular client page
bundle/               --> where webpack stores the app bundles
  app.bundle.js         --> main app bundle
  vendor.bundle.js      --> bundled dependencies
  app.bundle.js.map     --> main app map file for debugging
  vendor.bundle.js.map  --> dependencies map file for debugging
node_modules          --> npm packages for the dependencies
public                --> place for images and static public files
views                 --> contains all the views to be served
  app.pug               --> the main client page that initializes angular
webpack.config.js     --> config file for webpack to bundle files
webpack.loaders.js    --> webpack loaders for different types of files
package.json          --> project identity and dependencies
parliament.js         --> node server file
```

[angularjs]: http://angularjs.org/
[webpack]: https://webpack.github.io/
[node]: https://nodejs.org
[npm]: https://www.npmjs.org/
