import React from 'react'
import { Dialog, DialogTitle, Paper, Box } from '@mui/material'
import Draggable from 'react-draggable'
import { keyframes } from '@mui/system'

// 페이드인 애니메이션
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper
        {...props}
        sx={{
          ...props.sx,
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: `${fadeIn} 0.3s ease-out`,
          backdropFilter: 'blur(0px)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          '&:hover': {
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.3s ease'
          }
        }}
      />
    </Draggable>
  )
}

const DraggableDialog = ({ children, title, ...props }) => {
  return (
    <Dialog
      {...props}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          animation: `${fadeIn} 0.3s ease-out`
        }
      }}
    >
      {title && (
        <Box
          id="draggable-dialog-title"
          sx={{
            cursor: 'move',
            userSelect: 'none',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1565c0 100%)',
            },
            '&:active': {
              cursor: 'grabbing'
            }
          }}
        >
          <DialogTitle
            sx={{
              padding: 0,
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              margin: 0,
              flex: 1
            }}
            id="draggable-dialog-title"
          >
            {title}
          </DialogTitle>
        </Box>
      )}
      {children}
    </Dialog>
  )
}

export default DraggableDialog