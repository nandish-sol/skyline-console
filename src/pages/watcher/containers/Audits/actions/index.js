import Create from './Create';
import Delete from './Delete';

const actionConfigs = {
  rowActions: {
    moreActions: [
      {
        action: Delete,
      },
    ],
  },
  batchActions: [Delete],
  primaryActions: [Create],
};

export default actionConfigs;
