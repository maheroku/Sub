import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionForm from '../components/SubscriptionForm';

const noop = jest.fn();

describe('SubscriptionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders "Add Subscription" title when no initial value', () => {
    render(<SubscriptionForm initial={null} onSubmit={noop} onCancel={noop} loading={false} error="" />);
    expect(screen.getByRole('heading', { name: 'Add Subscription' })).toBeInTheDocument();
  });

  test('renders "Edit Subscription" title when initial value provided', () => {
    const initial = {
      name: 'Netflix',
      cost: 15.99,
      billingCycle: 'monthly',
      nextRenewalDate: '2026-04-15T00:00:00.000Z',
      category: 'entertainment',
      notes: '',
      currency: 'USD'
    };
    render(<SubscriptionForm initial={initial} onSubmit={noop} onCancel={noop} loading={false} error="" />);
    expect(screen.getByText('Edit Subscription')).toBeInTheDocument();
  });

  test('pre-populates fields from initial value', () => {
    const initial = {
      name: 'Spotify',
      cost: 9.99,
      billingCycle: 'yearly',
      nextRenewalDate: '2026-06-01T00:00:00.000Z',
      category: 'entertainment',
      notes: 'Family plan',
      currency: 'USD'
    };
    render(<SubscriptionForm initial={initial} onSubmit={noop} onCancel={noop} loading={false} error="" />);
    expect(screen.getByDisplayValue('Spotify')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Family plan')).toBeInTheDocument();
  });

  test('calls onCancel when Cancel button clicked', () => {
    const onCancel = jest.fn();
    render(<SubscriptionForm initial={null} onSubmit={noop} onCancel={onCancel} loading={false} error="" />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('calls onCancel when overlay background clicked', () => {
    const onCancel = jest.fn();
    const { container } = render(
      <SubscriptionForm initial={null} onSubmit={noop} onCancel={onCancel} loading={false} error="" />
    );
    const overlay = container.firstChild;
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalled();
  });

  test('calls onSubmit with form data on submit', async () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <SubscriptionForm initial={null} onSubmit={onSubmit} onCancel={noop} loading={false} error="" />
    );

    fireEvent.change(screen.getByPlaceholderText(/Netflix, Spotify/i), { target: { value: 'Hulu' } });
    fireEvent.change(screen.getByPlaceholderText('9.99'), { target: { value: '7.99' } });
    const dateInput = container.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2026-05-01' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add Subscription' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Hulu', cost: 7.99 })
      );
    });
  });

  test('shows error message when error prop is provided', () => {
    render(
      <SubscriptionForm initial={null} onSubmit={noop} onCancel={noop} loading={false} error="Something went wrong" />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('disables submit button and shows "Saving..." when loading', () => {
    render(<SubscriptionForm initial={null} onSubmit={noop} onCancel={noop} loading={true} error="" />);
    const btn = screen.getByText('Saving...');
    expect(btn).toBeDisabled();
  });
});
