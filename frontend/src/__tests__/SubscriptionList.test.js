import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionList from '../components/SubscriptionList';

const futureDateStr = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

const baseSub = (overrides = {}) => ({
  _id: 'abc123',
  name: 'Netflix',
  cost: 15.99,
  currency: 'USD',
  billingCycle: 'monthly',
  monthlyCost: 15.99,
  nextRenewalDate: futureDateStr(30),
  category: 'entertainment',
  ...overrides
});

describe('SubscriptionList', () => {
  test('shows empty state when no subscriptions', () => {
    render(<SubscriptionList subscriptions={[]} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText(/No subscriptions yet/i)).toBeInTheDocument();
  });

  test('renders subscription name and cost', () => {
    render(
      <SubscriptionList
        subscriptions={[baseSub()]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('$15.99 USD')).toBeInTheDocument();
  });

  test('shows "Renewing soon" badge for subscription within 7 days', () => {
    const sub = baseSub({ nextRenewalDate: futureDateStr(3) });
    render(<SubscriptionList subscriptions={[sub]} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText(/Renewing soon/i)).toBeInTheDocument();
  });

  test('does not show "Renewing soon" badge for subscription beyond 7 days', () => {
    const sub = baseSub({ nextRenewalDate: futureDateStr(10) });
    render(<SubscriptionList subscriptions={[sub]} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.queryByText(/Renewing soon/i)).not.toBeInTheDocument();
  });

  test('calls onEdit with subscription when edit button clicked', () => {
    const onEdit = jest.fn();
    const sub = baseSub();
    render(<SubscriptionList subscriptions={[sub]} onEdit={onEdit} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByTitle('Edit'));
    expect(onEdit).toHaveBeenCalledWith(sub);
  });

  test('calls onDelete with subscription id when delete button clicked', () => {
    const onDelete = jest.fn();
    const sub = baseSub();
    render(<SubscriptionList subscriptions={[sub]} onEdit={jest.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('Delete'));
    expect(onDelete).toHaveBeenCalledWith('abc123');
  });

  test('renders category badge', () => {
    render(
      <SubscriptionList
        subscriptions={[baseSub({ category: 'productivity' })]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText('productivity')).toBeInTheDocument();
  });

  test('renders multiple subscriptions', () => {
    const subs = [
      baseSub({ _id: '1', name: 'Netflix' }),
      baseSub({ _id: '2', name: 'Spotify' })
    ];
    render(<SubscriptionList subscriptions={subs} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Spotify')).toBeInTheDocument();
  });
});
