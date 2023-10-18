"use client";

import { PropsWithChildren, useEffect, useState } from "react";

const ConfigProvider = ({ children }: PropsWithChildren) => {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    setMount(true);
  }, []);
  //   if (!mount) {
  //     return (
  //       <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
  //         Loading...
  //       </div>
  //     );
  //   }
  return children;
};

export default ConfigProvider;
