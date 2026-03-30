import Start from './Start';
import Delete from './Delete';

const actionConfigs = {
  rowActions: {
    firstAction: Start,
    moreActions: [
      {
        action: Delete,
      },
    ],
  },
  batchActions: [Delete],
};

export default actionConfigs;
