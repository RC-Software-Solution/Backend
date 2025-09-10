let broadcastInventoryUpdate = null;

function setInventoryBroadcaster(fn) {
  broadcastInventoryUpdate = fn;
}

function emitInventoryUpdate(payload) {
  if (typeof broadcastInventoryUpdate === 'function') {
    broadcastInventoryUpdate(payload);
  }
}

module.exports = {
  setInventoryBroadcaster,
  emitInventoryUpdate
};


