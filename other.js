(function () {
  const keyChain = {};
  const activeKeys = {};
  const upActiveKeys = {};
  const keyDelays = {};
  const keyDownDelays = {};

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // window.addEventListener("keydown", (event) => {
  //   console.log("down", event.key, event);
  //   //console.time(event.key);
  //   //console.timeEnd(event.key + "_break");
  // });
  // window.addEventListener("keyup", (event) => {
  //   console.log("up", event.key, event);
  //   //console.timeEnd(event.key);
  //   //console.time(event.key + "_break");
  // });
  // window.addEventListener("keypress", (event) =>
  //   console.log("press", event.key, event)
  // );

  window.keyState = {};
  window.reportAllButtons = () => {
    for (const [sdlCode, states] of Object.entries(window.keyState)) {
      if (states.length === 0) {
        continue;
      }
      const state = states.shift();
      // console.log(">>", state, sdlCode);
      window.reportButton(sdlCode, state === "keydown");
    }
  };
  const dispatch = (type, key, code, keyCode, sdlCode) => {
    if (!sdlCode) {
      throw new Error(`Missing sdl code for key ${key}`);
    }
    const queue = window.keyState[sdlCode] || [];
    if (queue[queue.length - 1] === type) {
      return;
    }
    window.keyState[sdlCode] = queue;
    // console.log("report button", sdlCode, key, type === "keydown");
    queue.push(type);
    //window.reportButton(sdlCode, type === "keydown");
    return;
    // document.querySelector("#canvas").dispatchEvent(
    //   new KeyboardEvent(type, {
    //     keyCode: keyCode,
    //     which: keyCode,
    //     key,
    //     code,
    //     bubbles: true,
    //   })
    // );
    const chain = keyChain[key]
      ? keyChain[key]
      : new Promise((resolve) => resolve());
    if (keyDelays[key]) {
      if (type === "keydown") {
        return;
      } else {
        upActiveKeys[key] = true;
        return;
      }
    }

    document.body.dispatchEvent(
      new KeyboardEvent(type, {
        keyCode: keyCode,
        which: keyCode,
        key,
        code,
        bubbles: true,
        cancelable: false,
        defaultPrevented: true,
        composed: true,
        returnValue: false,
      })
    );
    // console.log("type", type, key);
    if (type === "keydown") {
      keyDelays[key] = setTimeout(() => {
        delete keyDelays[key];
        if (upActiveKeys[key]) {
          delete upActiveKeys[key];
          document.body.dispatchEvent(
            new KeyboardEvent("keyup", {
              keyCode: keyCode,
              which: keyCode,
              key,
              code,
              bubbles: true,
              cancelable: false,
              defaultPrevented: true,
              composed: true,
              returnValue: false,
            })
          );
        } else {
          document.body.dispatchEvent(
            new KeyboardEvent("keydown", {
              keyCode: keyCode,
              which: keyCode,
              key,
              code,
              bubbles: true,
              cancelable: false,
              defaultPrevented: true,
              composed: true,
              returnValue: false,
            })
          );
          keyDownDelays[key] = setInterval(() => {
            document.body.dispatchEvent(
              new KeyboardEvent("keydown", {
                keyCode: keyCode,
                which: keyCode,
                key,
                code,
                bubbles: true,
                cancelable: false,
                defaultPrevented: true,
                composed: true,
                returnValue: false,
              })
            );
          }, 150);
        }
      }, 100);
    } else {
      if (keyDownDelays[key]) {
        clearInterval(keyDownDelays[key]);
        delete keyDownDelays[key];
      }
    }
  };

  const handleFile = (fileNameKey) => {
    window.cancelRom();
    fetch(`/roms/${fileNameKey}`)
      .then((resp) => resp.blob())
      .then((blob) => blob.arrayBuffer())
      .then((buf) => {
        FS.writeFile("/rom.smc", new Uint8Array(buf));
        console.log(FS.stat("/rom.smc"));
        window.runRom("/rom.smc");
      });
  };

  setTimeout(() => {
    if (
      window.location.href.includes("192") ||
      window.location.href.includes("localhost")
    ) {
      handleFile("FROGNES_.BIN");
    }
  }, 2000);

  window.addEventListener(
    "message",
    (event) => {
      // console.log("REC MESSAGE", event);
      if (!event.data) {
        return;
      }
      let data = event.data;
      if (typeof data === "string") {
        data = JSON.parse(event.data);
      }
      if (data.type == "rawFile") {
        const fileName = decodeURI(data.key);
        window.cancelRom();
        FS.writeFile("/rom.smc", new Uint8Array(data.fileArray));
        console.log(FS.stat("/rom.smc"));
        window.runRom("/rom.smc");
        return;
      }
      if (data.type == "file") {
        handleFile(data.key);
      }
      if (data.type == "keyboard") {
        if (data.key === "up") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "ArrowUp",
              "ArrowUp",
              38,
              273
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "4",
              "Digit4",
              52,
              52
            );
          }
        }
        if (data.key === "left") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "ArrowLeft",
              "ArrowwLeft",
              37,
              276
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "2",
              "Digit2",
              50,
              50
            );
          }
        }
        if (data.key === "right") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "ArrowRight",
              "ArrowRight",
              39,
              275
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "1",
              "Digit1",
              49,
              49
            );
          }
        }
        if (data.key === "down") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "ArrowDown",
              "ArrowDown",
              40,
              274
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "3",
              "Digit3",
              51,
              51
            );
          }
        }

        if (data.key === "a") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "d",
              "KeyD",
              68,
              100
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "7",
              "Digit7",
              55,
              55
            );
          }
        }
        if (data.key === "b") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "c",
              "KeyC",
              67,
              99
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "8",
              "Digit8",
              56,
              56
            );
          }
        }
        if (data.key === "l") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "a",
              "KeyA",
              65,
              97
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "f",
              "KeyF",
              70,
              102
            );
          }
        }
        if (data.key === "r") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "z",
              "KeyZ",
              90,
              122
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "e",
              "KeyE",
              69,
              101
            );
          }
        }
        if (data.key === "start") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "Enter",
              "Enter",
              13,
              13
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "5",
              "Digit5",
              53,
              53
            );
          }
        }
        if (data.key === "select") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "Space",
              "Space",
              32,
              32
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "6",
              "Digit6",
              54,
              54
            );
          }
        }
        if (data.key === "y") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "x",
              "KeyX",
              88,
              120
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "0",
              "Digit0",
              48,
              48
            );
          }
        }
        if (data.key === "x") {
          if (data.player === "2") {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "s",
              "KeyS",
              83,
              115
            );
          } else {
            dispatch(
              data.action === "up" ? "keyup" : "keydown",
              "9",
              "Digit9",
              57,
              57
            );
          }
        }
      }
    },
    false
  );

  //            dispatch('keydown', key, code, keyCode)
  //            dispatch('keyup', key, code, keyCode)
  //createKeyElement('L', 'a', 'KeyA', 65, lrDiv)
  //      createKeyElement('R', 'z', 'KeyZ', 90, lrDiv)
  //      createKeyElement('Start', 'Enter', 'Enter', 13, lrDiv)
  //      createKeyElement('Select', 'Space', 'Space', 32, lrDiv)
  //
  //      const keysDiv = document.createElement('div')
  //      keysDiv.style.display='grid';
  //      keysDiv.style.gridTemplateColumns='repeat(3,1fr)';
  //      keysDiv.style.gap='3px';
  //      containerDiv.appendChild(keysDiv)
  //      createSpan(keysDiv)
  //      createKeyElement('Y', 'x', 'KeyX', 88, keysDiv)
  //      createSpan(keysDiv)
  //      createKeyElement('A', 'd', 'KeyD', 68, keysDiv)
  //      createSpan(keysDiv)
  //      createKeyElement('X', 's', 'KeyS', 83, keysDiv)
  //      createSpan(keysDiv)
  //      createKeyElement('A', 'd', 'KeyD', 68, keysDiv)
  //      createKeyElement('B', 'c', 'KeyC', 67, keysDiv)
  //      createSpan(keysDiv)
  //
  //
})();
