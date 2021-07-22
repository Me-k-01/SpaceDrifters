(function () {
  const keyMaps = [
    {
      'z': 'up',
      's': 'down',
      'q': 'left',
      'd': 'right',
      ' ': 'shoot',
      'e': 'grab',
      'f': 'drop',
    },
    {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      '0': 'shoot',
      '1': 'grab',
      '2': 'drop',
    }
  ];
  const stateMaps = [{}, {}];
  for ( const actionName of Object.values(keyMaps[0])) {
    stateMaps[0][actionName] = false;
    stateMaps[1][actionName] = false;
  }

  const press = (ev) => {
    const key = ev.key;
    keyMaps.findIndex((km, i) => {
      const action = km[key];
      if ( action ) {
        const sm = stateMaps[i];
        if ( sm[action] === true )  // Si l'état est le meme on ne change rien
          return true;

        sm[action] = true;
        let data;
        switch (action) {
          case "up":
            data = sm.down? ["y", 0]: ["y", 1];
            break;
          case "down":
            data = sm.up? ["y", 0]: ["y", -1];
            break;
          case "left":
            data = sm.right? ["x", 0]: ["x", -1];
            break;
          case "right":
            data = sm.left? ["x", 0]: ["x", 1];
            break;
          case "shoot":
            data = ["shoot", true];
          break;
          case "grab":
            data = sm.pickup? ["pickup", 0]: ["pickup", 1];
          break;
          case "drop":
            data = sm.pickup? ["pickup", 0]: ["pickup", -1];
          break;
        }
        data.unshift(i);
        ws.send(JSON.stringify(data));
        return true;
      }
    } );
  };

  const release = (ev) => {
    const key = ev.key;
    keyMaps.findIndex((km, i) => {
      const action = km[key];
      if ( ! action ) return;

      const sm = stateMaps[i];
      if ( sm[action] === false )
        return true;
      sm[action] = false;

      let data;
      switch (action) {
        case "up":
          data = sm.down? ["y", -1]: ["y", 0];
          break;
        case "down":
          data = sm.up? ["y", 1]: ["y", 0];
          break;
        case "left":
          data = sm.right?  ["x", 1]: ["x", 0];
          break;
        case "right":
          data = sm.left? ["x", -1]: ["x", 0];
          break;
        case "shoot":
          data = ["shoot", false];
          break;
        case "grab":
          data = sm.pickup? ["pickup", -1]: ["pickup", 0];
        break;
        case "drop":
          data = sm.pickup? ["pickup", 1]: ["pickup", 0];
        break;
      }
      data.unshift(i);
      ws.send(JSON.stringify(data));
      return true;
    } );
  };
  addEventListener("keydown", press);
  addEventListener("keyup", release);
})();
