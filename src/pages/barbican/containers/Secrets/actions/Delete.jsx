import { ConfirmAction } from 'containers/Action';
import globalSecretsStore from 'stores/barbican/secrets';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Secret');
  }

  get actionName() {
    return t('Delete Secret');
  }

  get buttonText() {
    return t('Delete');
  }

  get isDanger() {
    return true;
  }

  policy = 'secret:delete';

  allowedCheckFunc = () => true;

  onSubmit = (item) => {
    const { id } = item;
    return globalSecretsStore.delete({ id });
  };
}
