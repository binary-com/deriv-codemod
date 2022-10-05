<p align="center">
  <a href="https://www.npmjs.com/package/deriv-codemod" target="_blank" >
    <img src="https://badge.fury.io/js/deriv-codemod.svg" alt="npm version">
  </a>
</p>

`deriv-codemod` is a tool for helping migrate code. It uses [jscodeshift](https://github.com/facebook/jscodeshift) internally to transform the source code.

## Installation

`deriv-codemod` requires [Node.js](https://nodejs.org/) v14+ to run.

To install globally:

```sh
npm i -g deriv-codemod
```

Just run the below command to get started.

```sh
deriv-codemod
```

## How to use

Read about how to use the command [here](https://github.com/binary-com/deriv-codemod/blob/master/HOW-TO-USE.md).

## List of codemods available

-   **Change extension**

    -   It simply modifies the extension of the file.

-   **Convert proptypes to TS**
    -   It converts React `propTypes` to Typescript type.
    -   The things it does are:
        -   Remove prop-types import from the import section.
        -   Collects the component name and the list of properties and their type in propTypes.
        -   Generates a TS type based on component name and collected list of properties and their type.
        -   Inserts the generated type as a type annotation to the props param of the component. It also supports destructured props, props in React.memo and React.forwardRef.
        -   Removes the propTypes.
        -   It also supports multiple components in the same file.
    -   React `propTypes` to TS type:
        -   Converts all the primitive types such as boolean, string, number to respective TS type.
        -   For `PropTypes.func`, it will insert an empty anonymous arrow fn type `() => void`.
        -   For `PropTypes.object` or `PropTypes.array`, it maps unknown as respective TS type.
        -   It also supports `PropTypes.oneOfTypes` which will map it to TS union types.
    -   Sample conversion:
        ![image](https://user-images.githubusercontent.com/56330681/152483079-fff0639c-3f43-43fc-9510-9feb6f7e89a6.png)

## Local development

Want to contribute? Great!

Open your Terminal and run the below command.

To install dependencies:

```sh
npm install
```

To build:

```sh
npm run build
```

Please check [jscodeshift](https://github.com/facebook/jscodeshift) docs before writing a codemod.
