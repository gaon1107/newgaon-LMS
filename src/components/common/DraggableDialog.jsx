import React from 'react'
import { Dialog, DialogTitle, Paper } from '@mui/material'
import Draggable from 'react-draggable'

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  )
}

const DraggableDialog = ({ children, title, ...props }) => {
  return (
    <Dialog
      {...props}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      {title && (
        <DialogTitle
          style={{ cursor: 'move' }}
          id="draggable-dialog-title"
        >
          {title}
        </DialogTitle>
      )}
      {children}
    </Dialog>
  )
}

export default DraggableDialog