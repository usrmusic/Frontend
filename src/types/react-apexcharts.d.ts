/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-apexcharts' {
  // Minimal typing shim for react-apexcharts to satisfy TypeScript in this project.
  // Replace 'any' with more precise types if you add @types/react-apexcharts in the future.
  import * as React from 'react';
  const ReactApexChart: React.ComponentType<any>;
  export default ReactApexChart;
}
