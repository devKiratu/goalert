import React, { useEffect, useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import TextField, { TextFieldProps } from '@material-ui/core/TextField'
import { Check, Close } from '@material-ui/icons'
import InputAdornment from '@material-ui/core/InputAdornment'
import { makeStyles } from '@material-ui/core'
import { DEBOUNCE_DELAY } from '../config'

const isValidNumber = gql`
  query ($number: String!) {
    phoneNumberInfo(number: $number) {
      id
      valid
    }
  }
`

const useStyles = makeStyles({
  valid: {
    fill: 'green',
  },
  invalid: {
    fill: 'red',
  },
})

type InputType = 'tel' | 'sid'
type TelTextFieldProps = TextFieldProps & {
  value: string
  inputTypes?: InputType[]
}

export default function TelTextField(props: TelTextFieldProps): JSX.Element {
  const { inputTypes = ['tel'], value = '', ...textFieldProps } = props
  const classes = useStyles()
  const [debouncedValue, setDebouncedValue] = useState('')

  // debounce to set the phone number
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedValue(value)
    }, DEBOUNCE_DELAY)
    return () => clearTimeout(t)
  }, [value])

  const reTel = /^\+\d+/
  const reSID = /^MG[a-zA-Z0-9]+/
  const onlyTel = inputTypes.length === 1 && inputTypes[0] === 'tel'
  const onlySID = inputTypes.length === 1 && inputTypes[0] === 'sid'
  const isSID = (s: string): boolean => {
    return inputTypes.includes('sid') && reSID.test(s)
  }

  const skipValidation = (): boolean => {
    if (!debouncedValue || props.disabled || !inputTypes.includes('tel')) {
      return true
    }
    if (onlyTel && !reTel.test(debouncedValue)) {
      return true
    }
    if (isSID(debouncedValue)) {
      return true
    }
    if (onlySID) {
      return true
    }
    return false
  }

  // validate the input value
  const { data } = useQuery(isValidNumber, {
    pollInterval: 0,
    variables: { number: debouncedValue },
    fetchPolicy: 'cache-first',
    skip: skipValidation(),
  })

  const valid = Boolean(data?.phoneNumberInfo?.valid)

  let adorn
  if (value === '' || isSID(value) || props.disabled) {
    // no adornment
  } else if (valid) {
    adorn = <Check className={classes.valid} />
  } else {
    adorn = <Close className={classes.invalid} />
  }

  // add live validation icon to the right of the textfield
  const InputProps = adorn
    ? {
        endAdornment: <InputAdornment position='end'>{adorn}</InputAdornment>,
        ...props.InputProps,
      }
    : props.InputProps

  const getHelperText = (): TextFieldProps['helperText'] => {
    if (props.helperText) {
      return props.helperText
    }
    if (onlyTel) {
      return 'Include country code e.g. +1 (USA), +91 (India), +44 (UK)'
    }
    if (inputTypes.includes('tel')) {
      return 'For phone numbers, include country code e.g. +1 (USA), +91 (India), +44 (UK)'
    }
    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!props.onChange) return
    if (!e.target.value) return props.onChange(e)

    const isLikeTel = /^[+\d(]/.test(e.target.value.trimLeft())

    if (onlyTel || isLikeTel) {
      e.target.value = '+' + e.target.value.replace(/[^0-9]/g, '')
    } else {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
    }

    return props.onChange(e)
  }

  return (
    <TextField
      fullWidth
      {...textFieldProps}
      type={onlyTel ? 'tel' : props.type}
      InputProps={InputProps}
      value={value}
      helperText={getHelperText()}
      onChange={handleChange}
    />
  )
}
