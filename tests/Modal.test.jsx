// Test hộp thoại: gõ vào ô nhập bên trong không được làm mất focus.
import { useState } from 'react'
import { describe, test, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Modal from '../src/components/ui/Modal'

// Giống cách các trang dùng Modal: state form nằm ở trang cha, onClose là arrow function mới mỗi lần render.
function FormInModal() {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(true)
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Add product">
      <input aria-label="Name" value={name} onChange={(event) => setName(event.target.value)} />
    </Modal>
  )
}

describe('Modal', () => {
  test('gõ vào ô nhập thì focus vẫn ở ô nhập', () => {
    render(<FormInModal />)
    const input = screen.getByLabelText('Name')
    input.focus()

    fireEvent.change(input, { target: { value: 'A' } })
    fireEvent.change(input, { target: { value: 'As' } })

    expect(input).toHaveValue('As')
    expect(document.activeElement).toBe(input)
  })

  test('Escape vẫn đóng hộp thoại', () => {
    render(<FormInModal />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
