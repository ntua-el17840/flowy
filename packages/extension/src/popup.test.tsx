import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Popup from './popup'

describe('Popup', () => {
  it('renders without crashing', () => {
    render(<Popup />)
    // Add basic assertions based on your Popup component's content
    expect(document.body).toBeTruthy()
  })
}) 