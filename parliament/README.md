# Moloch Parliament

Moloch Parliament is an [Angular5][angular] web app to view multiple Moloch clusters.

This project was generated with [Angular CLI][angularcli] version 1.5.5.


### Install Dependencies

The app uses dependencies that are all bundled using [webpack][webpack] via `ng build`. `ng build` compiles the application into an output directory, in this case `parliament/dist`. This is done automatically when starting the application.

The app uses a number of node.js tools for initialization and testing. You must have node.js and its package manager (npm) installed. You can get them from [http://nodejs.org/][node].

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
npm start -- --password=somepassword --port=8765 --file=./absolute/path/to/parliament.json --keyFile=./absolute/path/to/keyFile.pem --certFile=./absolute/path/to/certFile.pem
```
This command starts the app, passing in the password, port, file location, and key and cert file locations. It also bundles the application files into `parliament/dist/inline.bundle.js`, `parliament/dist/main.bundle.js`, `parliament/dist/polyfills.bundle.js`, and `parliament/dist/styles.bundle.js`.

**The parameters are defined as follows:**

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| password  | EMPTY   | Password will be used to login to update the parliament. If it is not set, the app runs in read only mode. |
| port      | 8008    | Port for the web app to listen on. |
| file      | ./parliament.json | Absolute path to the JSON file to store your parliament information. |
| keyFile   | EMPTY   | Private certificate to use for https, if not set then http will be used. **certfile** must also be set. |
| certFile  | EMPTY   | Public certificate to use for https, if not set then http will be used. **keyFile** must also be set. |

_**Important**: the leading `--`, before the parameters is essential. As are the leading `--` before each parameter._

_Note: if you do not pass in the port or file arguments, the defaults are used._

Now browse to the app at `http://localhost:8765`, or whichever port you passed into the `npm start` command.

To login, use the password that you passed into the `npm start` command.

#### Development

To start the app for development and testing, simply run:
```
npm run dev
```

This command starts the app with the necessary flags set (`--password=admin --port=8008 --file=./parliament.dev.json`) and bundles the application files into into `parliament/dist/inline.bundle.js`, `parliament/dist/main.bundle.js`, `parliament/dist/polyfills.bundle.js`, `parliament/dist/styles.bundle.js`, and `parliament/dist/vendor.bundle.js` with corresponding map files for debugging.

`ng build` uses webpack to package the files then watches for changes to relevant files, and re-bundles the app after each save.

Now browse to the app at `http://localhost:8008`.

To login, use the password, 'admin'

#### Further help with running the application

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


### Contributing
Before submitting a pull request with your contribution, execute both `npm run tslint` and `npm run jslint`, and correct any errors. The first command runs [tslint][tslint], a static code analysis tool that checks TypeScript code for readability, maintainability, and functionality errors (for client code). The second runs [jshint][jshint], another static code analysis tool for checking if JavaScript source code complies with coding rules (for server code).

:octocat: Please use a fork to submit a [pull request](https://help.github.com/articles/creating-a-pull-request/) for your contribution.


### Directory Layout
```
dist/                   --> all of the bundled source files
node_modules/           --> npm packages for the dependencies
public/                 --> place for images and static public files
src/                    --> all of the client source files for the application
  app/                    --> all the main application files go here
    app.module.ts           --> the root module that is bootstrapped to launch the app
    app.pipes.ts            --> defines pipes (filters) to modify/transform data
    auth.ts                 --> defines models for the auth service
    directives.ts           --> defines custom directives
    parliament.ts           --> defines models for the parliament object
    *.component.ts          --> defines components for page functions
    *.service.ts            --> defines any services used to provide data to the app
    *.interceptor.ts        --> defines any http interceptors to modify requests/responses
    *.html                  --> angular view for a component
    *.css                   --> styles for a component
  environments/           --> contains the environment files
    environment.prod.ts     --> defines the production environment variable
    environment.ts          --> defines the default environment variable
  index.html              --> the main HTML page that exposes app-root to be bootstrapped
  main.ts                 --> the app's main entry point that is compiles and bootstrapped with the root module
  polyfills.ts            --> polyfills help normalize differences between browsers' support of web standards
  styles.css              --> global app styles
  tsconfig.app.json       --> typeScript compiler configuration for the app
.angular-cli.json       --> config file for angular-cli
.jshintrc               --> used to configure which linting rules get run on the server code
.gitignore              --> makes sure autogenerated files are not committed to source control
package.json            --> project identity and dependencies
README.md               --> basic docs for the project
server.js               --> node server file
tsconfig.json           --> typeScript compiler configuration for your IDE to give you helpful tooling
tslint.json             --> used to configure which linting rules get run on the client code
```

[angular]: https://angular.io/
[angularcli]: https://github.com/angular/angular-cli
[webpack]: https://webpack.github.io/
[node]: https://nodejs.org
[npm]: https://www.npmjs.org/
[tslint]: https://github.com/palantir/tslint
[jshint]: https://github.com/jshint/jshint
