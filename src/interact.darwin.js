export const initialize = () => {
  return Promise.resolve([]);
};

export const displayError = (msg) => {
  console.error(msg);
  return () => false;
};

export const blink = () => {
  console.log("blink register");

  return () => {
    console.log("blink clean up");
  };
};

export const listenForInput = (onEvent) => {
  console.log("listening would be here...");
};

export const destroy = () => {
  return Promise.resolve([]);
};
