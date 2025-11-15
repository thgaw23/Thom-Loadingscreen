local hasCompleted = false
local lastResourceName = ""
local resourceList = {}

-- Function to shutdown loading screen
local function shutdownLoading()
    if not hasCompleted then
        hasCompleted = true
        Wait(300)
        ShutdownLoadingScreenNui()
        ShutdownLoadingScreen()
    end
end

-- Track when resources start loading
AddEventHandler('onClientResourceStart', function(resourceName)
    if not hasCompleted and resourceName then
        local currentResource = GetCurrentResourceName()
        -- Don't track the loading screen resource itself
        if resourceName ~= currentResource then
            lastResourceName = resourceName
            
            -- Add to list if not already there (optimized check)
            local found = false
            for i = 1, #resourceList do
                if resourceList[i] == resourceName then
                    found = true
                    break
                end
            end
            if not found then
                resourceList[#resourceList + 1] = resourceName
            end
            
            -- Immediately send resource name to NUI
            SendNUIMessage({
                eventName = 'loadProgress',
                resourceName = resourceName
            })
        end
    end
end)

-- Listen to FiveM's built-in loadProgress event
AddEventHandler('loadProgress', function(loadFraction)
    if not hasCompleted then
        -- Update current resource based on progress
        if #resourceList > 0 then
            local progressIndex = math.floor(loadFraction * #resourceList) + 1
            if progressIndex <= #resourceList then
                lastResourceName = resourceList[progressIndex]
            end
        end
        
        -- Send progress to NUI
        SendNUIMessage({
            eventName = 'loadProgress',
            loadFraction = loadFraction,
            resourceName = lastResourceName
        })
    end
end)

-- Continuous check thread - checks if player is ready and shuts down
CreateThread(function()
    while not hasCompleted do
        Wait(200) -- Check every 200ms for faster response
        
        local playerId = PlayerId()
        
        -- Basic checks: player must be active and connected
        if NetworkIsPlayerActive(playerId) and NetworkIsPlayerConnected(playerId) then
            local ped = PlayerPedId()
            
            -- Ped must exist and be valid
            if ped and ped > 0 then
                local coords = GetEntityCoords(ped)
                
                -- Must have valid coordinates (not at 0,0,0)
                if coords and (coords.x ~= 0.0 or coords.y ~= 0.0) then
                    -- Not in transition states
                    if not IsPlayerSwitchInProgress() and not IsScreenFadedOut() then
                        -- Not in pause menu
                        if not IsPauseMenuActive() then
                            -- Player is ready - shutdown loading screen
                            shutdownLoading()
                            break
                        end
                    end
                end
            end
        end
    end
end)

-- Safety timeout: Force shutdown after 10 seconds maximum
CreateThread(function()
    Wait(10000) -- Wait 10 seconds
    if not hasCompleted then
        shutdownLoading()
    end
end)

-- Event handlers for various game events that indicate player is ready
AddEventHandler('playerSpawned', function()
    Wait(500)
    if not hasCompleted then
        shutdownLoading()
    end
end)

RegisterCommand('skipload', function()
    -- Dev helper command to skip the loader if needed
    if not hasCompleted then
        hasCompleted = true
        Wait(500)
        ShutdownLoadingScreenNui()
        ShutdownLoadingScreen()
    end
end, false)

