import { useState } from 'react';
import './styles.css';

function IndexPopup() {
  const [count, setCount] = useState(0);

  return (
    <div className="w-64 p-4">
      <h1 className="text-xl font-bold mb-4">Flowy HMR Test</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Try clicking the button below!
      </p>
      <button
        className="btn btn-primary"
        onClick={() => setCount((c) => c + 1)}>
        Clicked {count} times
      </button>
    </div>
  );
}

export default IndexPopup; 