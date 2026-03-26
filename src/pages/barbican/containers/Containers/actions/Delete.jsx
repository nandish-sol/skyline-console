import { ConfirmAction } from 'containers/Action';
import globalContainersStore from 'stores/barbican/containers';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Container');
  }

  get actionName() {
    return t('Delete Container');
  }

  get buttonText() {
    return t('Delete');
  }

  get isDanger() {
    return true;
  }

  policy = 'container:delete';

  allowedCheckFunc = () => true;

  onSubmit = (item) => {
    const { id, secret_refs } = item;
    return globalContainersStore.delete({ id, secret_refs });
  };
}
