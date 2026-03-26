import StartAction from './Start';
import DeleteAction from './Delete';

const actionConfigs = {
  rowActions: {
    firstAction: StartAction,
    moreActions: [
      {
        action: DeleteAction,
      },
    ],
  },
  batchActions: [DeleteAction],
  primaryActions: [],
};

export default actionConfigs;
