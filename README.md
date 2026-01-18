# Fluid Text React Component

This project contains a React component called `FluidText` that renders fluid text on a canvas with particle effects and mouse interactions.

## Installation

To get started, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd fluid-text-react
npm install
```

## Usage

You can use the `FluidText` component in your React application as follows:

```jsx
import React from 'react';
import FluidText from './src/index';

const App = () => {
  return (
    <div>
      <FluidText 
        text="Hello, World!" 
        fontSize={120} 
        strokeColor="#000" 
        leftColor="#578fb1" 
        rightColor="#ff0000" 
      />
    </div>
  );
};

export default App;
```

## Development

To start the development server, run:

```bash
npm start
```

This will build the project and serve it locally.

## Building

To create a production build, run:

```bash
npm run build
```

This will bundle the project using Rollup.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.