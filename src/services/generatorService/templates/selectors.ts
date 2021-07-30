export const getTemplate = () => `
  import { createSelector } from 'reselect';
  import { ApplicationState } from 'store';

  import { <%= types.join(', ') %>  } from './types';

  const <%= stateSelectorName %>  = (state: ApplicationState) => state.<%= storeName %>;

<% for(const selector of selectors) { %>

export const <%= selector.name %>  = createSelector<ApplicationState, <%= storeInterfaceName %> , <%= selector.returnType %> >(
  <%= stateSelectorName %>,
  state => state.<%= selector.fieldPath %>,
);

<% } %>
`;
